package io.archlens.deployment.discovery;

import io.archlens.deployment.models.*;
import java.lang.reflect.Modifier;
import java.util.*;
import lombok.extern.slf4j.Slf4j;
import org.jboss.jandex.*;

/**
 * Analyses CDI injection points to build a dependency graph between components.
 */
@Slf4j
public class DependencyAnalyzer {

    private static final DotName INJECT = DotName.createSimple("jakarta.inject.Inject");
    private static final DotName INJECT_JAVAX = DotName.createSimple("javax.inject.Inject");
    private static final DotName PRODUCES = DotName.createSimple("jakarta.enterprise.inject.Produces");
    private static final DotName QUALIFIER = DotName.createSimple("jakarta.inject.Qualifier");
    private static final DotName QUALIFIER_JAVAX = DotName.createSimple("javax.inject.Qualifier");

    private static final DotName ALL = DotName.createSimple("io.quarkus.arc.All");

    private static final DotName PROVIDER = DotName.createSimple("jakarta.inject.Provider");
    private static final DotName PROVIDER_JAVAX = DotName.createSimple("javax.inject.Provider");
    private static final DotName INSTANCE = DotName.createSimple("jakarta.enterprise.inject.Instance");
    private static final DotName INJECTABLE_INSTANCE = DotName.createSimple("io.quarkus.arc.InjectableInstance");
    private static final DotName OPTIONAL = DotName.createSimple("java.util.Optional");
    private static final DotName LIST = DotName.createSimple("java.util.List");
    private static final DotName SET = DotName.createSimple("java.util.Set");
    private static final DotName COLLECTION = DotName.createSimple("java.util.Collection");
    private static final DotName INSTANCE_HANDLE = DotName.createSimple("io.quarkus.arc.InstanceHandle");

    private static final Set<DotName> SINGLE_WRAPPER_TYPES = Set.of(
            PROVIDER, PROVIDER_JAVAX, INSTANCE, INJECTABLE_INSTANCE, OPTIONAL
    );

    private static final Set<DotName> MULTI_WRAPPER_TYPES = Set.of(
            LIST, SET, COLLECTION
    );

    private DependencyAnalyzer() {
    }

    /**
     * Scans the Jandex {@code index} for all CDI injection points and records
     * {@link DependencyModel} edges in {@code model.getDependencies()}.
     *
     * @param index the Jandex application index (build-time, fully populated)
     * @param model the partially-built model (components must already be classified)
     */
    public static void analyze(IndexView index, ArchitectureModel model) {
        Map<String, ComponentCoordinate> classIndex = buildClassIndex(model);
        Set<DotName> qualifierAnnotations = collectQualifierAnnotations(index);
        System.out.println(qualifierAnnotations);

        analyzeInjectAnnotations(index, model, classIndex);
        analyzeQualifierOnlyFields(index, model, classIndex, qualifierAnnotations);
        analyzeImplicitSingleConstructors(index, model, classIndex);
        analyzeProducerMethodParameters(index, model, classIndex);

        log.info("DependencyAnalyzer found {} dependencies", model.getDependencies().size());
    }

    private static void analyzeInjectAnnotations(IndexView index,
                                                 ArchitectureModel model,
                                                 Map<String, ComponentCoordinate> classIndex) {

        List<AnnotationInstance> injectAnnotations = new ArrayList<>();
        injectAnnotations.addAll(index.getAnnotations(INJECT));
        injectAnnotations.addAll(index.getAnnotations(INJECT_JAVAX));

        for (AnnotationInstance ai : injectAnnotations) {
            switch (ai.target().kind()) {
                case FIELD -> processInjectedField(ai.target().asField(), index, model, classIndex);
                case METHOD_PARAMETER ->
                        processInjectedMethodParameter(ai.target().asMethodParameter(), index, model, classIndex);
                default -> {
                }
            }
        }
    }

    private static void analyzeQualifierOnlyFields(IndexView index,
                                                   ArchitectureModel model,
                                                   Map<String, ComponentCoordinate> classIndex,
                                                   Set<DotName> qualifierAnnotations) {
        for (String className : classIndex.keySet()) {
            ClassInfo classInfo = index.getClassByName(DotName.createSimple(className));
            if (classInfo == null) continue;

            for (FieldInfo field : classInfo.fields()) {
                if (field.hasAnnotation(INJECT) || field.hasAnnotation(INJECT_JAVAX)) continue;
                if (Modifier.isStatic(field.flags())) continue;

                boolean hasQualifier = field.annotations().stream()
                        .anyMatch(a -> qualifierAnnotations.contains(a.name()));

                if (hasQualifier) {
                    processInjectedField(field, index, model, classIndex);
                }
            }
        }
    }

    private static void analyzeImplicitSingleConstructors(IndexView index,
                                                          ArchitectureModel model,
                                                          Map<String, ComponentCoordinate> classIndex) {
        for (String className : classIndex.keySet()) {
            ClassInfo classInfo = index.getClassByName(DotName.createSimple(className));
            if (classInfo == null) continue;

            List<MethodInfo> constructors = classInfo.methods().stream()
                    .filter(m -> m.name().equals("<init>"))
                    .toList();

            if (constructors.size() != 1) continue;

            MethodInfo ctor = constructors.get(0);
            if (ctor.hasAnnotation(INJECT) || ctor.hasAnnotation(INJECT_JAVAX)) continue;

            for (int i = 0; i < ctor.parametersCount(); i++) {
                Type paramType = ctor.parameterType(i);
                processInjectionType(className, paramType, false, index, model, classIndex);
            }
        }
    }

    private static void analyzeProducerMethodParameters(IndexView index,
                                                        ArchitectureModel model,
                                                        Map<String, ComponentCoordinate> classIndex) {
        for (AnnotationInstance ai : index.getAnnotations(PRODUCES)) {
            if (ai.target().kind() != AnnotationTarget.Kind.METHOD) continue;

            MethodInfo method = ai.target().asMethod();
            String fromClass = method.declaringClass().name().toString();

            if (!classIndex.containsKey(fromClass)) continue;

            for (int i = 0; i < method.parametersCount(); i++) {
                Type paramType = method.parameterType(i);
                processInjectionType(fromClass, paramType, false, index, model, classIndex);
            }
        }
    }

    private static void processInjectedField(FieldInfo field,
                                             IndexView index,
                                             ArchitectureModel model,
                                             Map<String, ComponentCoordinate> classIndex) {
        String fromClass = field.declaringClass().name().toString();
        if (!classIndex.containsKey(fromClass)) return;

        boolean hasAll = field.hasAnnotation(ALL);
        processInjectionType(fromClass, field.type(), hasAll, index, model, classIndex);
    }

    private static void processInjectedMethodParameter(MethodParameterInfo param,
                                                       IndexView index,
                                                       ArchitectureModel model,
                                                       Map<String, ComponentCoordinate> classIndex) {
        MethodInfo method = param.method();
        String fromClass = method.declaringClass().name().toString();
        if (!classIndex.containsKey(fromClass)) return;

        boolean hasAll = param.hasAnnotation(ALL);
        processInjectionType(fromClass, param.type(), hasAll, index, model, classIndex);
    }

    private static void processInjectionType(String fromClass,
                                             Type type,
                                             boolean hasAll,
                                             IndexView index,
                                             ArchitectureModel model,
                                             Map<String, ComponentCoordinate> classIndex) {
        UnwrapResult unwrapped = unwrapType(type);

        if (unwrapped.logicalType() == null) {
            log.trace("Skipping unresolvable injection type {} in {}", type, fromClass);
            return;
        }

        boolean expandAll = hasAll || unwrapped.isMultiInjection();

        if (expandAll) {
            addDependenciesForAllImplementors(fromClass, unwrapped.logicalType(), index, model, classIndex);
        } else {
            addDependencyIfKnown(fromClass, unwrapped.logicalType().toString(), model, classIndex);
        }
    }

    private static UnwrapResult unwrapType(Type type) {
        if (type.kind() != Type.Kind.PARAMETERIZED_TYPE) {
            // Plain class/interface — no wrapper
            return new UnwrapResult(type.name(), false);
        }

        ParameterizedType pt = type.asParameterizedType();
        DotName raw = pt.name();
        List<Type> args = pt.arguments();

        if (args.isEmpty()) {
            return new UnwrapResult(raw, false);
        }

        if (SINGLE_WRAPPER_TYPES.contains(raw)) {
            Type inner = args.get(0);
            boolean isMulti = INSTANCE.equals(raw)
                    || INJECTABLE_INSTANCE.equals(raw)
                    || PROVIDER.equals(raw)
                    || PROVIDER_JAVAX.equals(raw);
            return new UnwrapResult(resolveSimpleType(inner), isMulti);
        }

        if (MULTI_WRAPPER_TYPES.contains(raw)) {
            Type inner = args.get(0);

            if (inner.kind() == Type.Kind.PARAMETERIZED_TYPE) {
                ParameterizedType innerPt = inner.asParameterizedType();
                if (INSTANCE_HANDLE.equals(innerPt.name()) && !innerPt.arguments().isEmpty()) {
                    return new UnwrapResult(resolveSimpleType(innerPt.arguments().get(0)), true);
                }
            }

            return new UnwrapResult(resolveSimpleType(inner), true);
        }

        return new UnwrapResult(raw, false);
    }

    private static DotName resolveSimpleType(Type t) {
        return switch (t.kind()) {
            case CLASS, PARAMETERIZED_TYPE -> t.name();
            case ARRAY -> t.name();
            default -> null; // wildcard / type variable — skip
        };
    }

    private static void addDependenciesForAllImplementors(String fromClass,
                                                          DotName targetType,
                                                          IndexView index,
                                                          ArchitectureModel model,
                                                          Map<String, ComponentCoordinate> classIndex) {
        if (targetType == null) return;

        ClassInfo targetClassInfo = index.getClassByName(targetType);

        Set<ClassInfo> candidates = new HashSet<>();

        if (targetClassInfo != null && targetClassInfo.isInterface()) {
            candidates.addAll(index.getAllKnownImplementors(targetType));
        } else {
            candidates.addAll(index.getAllKnownSubclasses(targetType));
            if (targetClassInfo != null) {
                candidates.add(targetClassInfo);
            }
        }

        if (candidates.isEmpty()) {
            addDependencyIfKnown(fromClass, targetType.toString(), model, classIndex);
        } else {
            for (ClassInfo candidate : candidates) {
                addDependencyIfKnown(fromClass, candidate.name().toString(), model, classIndex);
            }
        }
    }

    private static void addDependencyIfKnown(String fromClass,
                                             String toClass,
                                             ArchitectureModel model,
                                             Map<String, ComponentCoordinate> classIndex) {
        if (fromClass.equals(toClass)) return;
        if (!classIndex.containsKey(fromClass)) return;
        if (!classIndex.containsKey(toClass)) return;

        ComponentCoordinate from = classIndex.get(fromClass);
        ComponentCoordinate to = classIndex.get(toClass);

        DependencyModel dep = new DependencyModel(fromClass, toClass, from, to);
        if (!model.getDependencies().contains(dep)) {
            model.getDependencies().add(dep);
            log.debug("Dependency: {} -> {}", fromClass, toClass);
        }
    }

    private static Set<DotName> collectQualifierAnnotations(IndexView index) {
        Set<DotName> qualifiers = new HashSet<>();
        collectQualifiersForMeta(index, QUALIFIER, qualifiers);
        collectQualifiersForMeta(index, QUALIFIER_JAVAX, qualifiers);
        return qualifiers;
    }

    private static void collectQualifiersForMeta(IndexView index,
                                                 DotName metaQualifier,
                                                 Set<DotName> result) {
        for (AnnotationInstance ai : index.getAnnotations(metaQualifier)) {
            if (ai.target().kind() == AnnotationTarget.Kind.CLASS) {
                result.add(ai.target().asClass().name());
            }
        }
    }

    private static Map<String, ComponentCoordinate> buildClassIndex(ArchitectureModel model) {
        Map<String, ComponentCoordinate> index = new HashMap<>();

        for (SubsystemModel mod : model.getSubsystems()) {
            for (LayerModel layer : mod.getLayers()) {
                for (ComponentModel comp : layer.getComponents()) {
                    index.put(comp.getClassName(),
                            new ComponentCoordinate(layer.getId(), mod.getId()));
                }
            }
        }

        for (LayerModel shared : model.getSharedLayers()) {
            for (ComponentModel comp : shared.getComponents()) {
                index.put(comp.getClassName(),
                        new ComponentCoordinate(shared.getId(), null));
            }
        }

        return index;
    }

    private record UnwrapResult(DotName logicalType, boolean isMultiInjection) {
    }
}