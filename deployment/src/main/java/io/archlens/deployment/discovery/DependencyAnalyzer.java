package io.archlens.deployment.discovery;

import io.archlens.deployment.models.*;
import java.util.*;
import lombok.extern.slf4j.Slf4j;
import org.jboss.jandex.*;

/**
 * Analyses CDI injection points to build a dependency graph between components.
 *
 * <p>Inspects {@code @Inject}-annotated fields and constructor parameters across
 * all known classes. For each injection point {@link DependencyModel} edge
 * is recorded.
 */
@Slf4j
public class DependencyAnalyzer {

    private static final DotName INJECT = DotName.createSimple("jakarta.inject.Inject");
    private static final DotName INJECT_JAVAX = DotName.createSimple("javax.inject.Inject");

    private DependencyAnalyzer() {
    }

    /**
     * Scans the Jandex index for {@code @Inject} fields and constructor parameters,
     * resolves source/target classes to their layer/module coordinates from the
     * already-built model, and populates {@code model.getDependencies()}.
     *
     * @param index the Jandex application index
     * @param model the partially-built model (components should be already classified)
     */
    public static void analyze(IndexView index, ArchitectureModel model) {
        Map<String, ComponentCoordinate> classIndex = buildClassIndex(model);

        List<DependencyModel> deps = new ArrayList<>();

        // Scan all @Inject annotations on fields
        for (DotName injectAnnotation : List.of(INJECT, INJECT_JAVAX)) {
            for (AnnotationInstance ai : index.getAnnotations(injectAnnotation)) {
                if (ai.target().kind() == AnnotationTarget.Kind.FIELD) {
                    FieldInfo field = ai.target().asField();
                    String fromClass = field.declaringClass().name().toString();
                    String toClass = field.type().name().toString();
                    addDependency(fromClass, toClass, classIndex, deps);
                } else if (ai.target().kind() == AnnotationTarget.Kind.METHOD_PARAMETER) {
                    // Constructor injection with explicit @Inject
                    MethodParameterInfo param = ai.target().asMethodParameter();
                    if (param.method().name().equals("<init>")) {
                        String fromClass = param.method().declaringClass().name().toString();
                        String toClass = param.type().name().toString();
                        addDependency(fromClass, toClass, classIndex, deps);
                    }
                }
            }
        }

        // Also scan constructors of classified classes for implicit injection
        // (Quarkus supports single-constructor injection without @Inject)
        for (ClassInfo ci : index.getKnownClasses()) {
            String fromClass = ci.name().toString();
            if (!classIndex.containsKey(fromClass)) continue;

            List<MethodInfo> constructors = ci.methods().stream()
                    .filter(m -> m.name().equals("<init>"))
                    .toList();

            if (constructors.size() == 1) {
                MethodInfo ctor = constructors.get(0);
                // Only process if no @Inject already handled it
                boolean alreadyAnnotated = ctor.annotations().stream()
                        .anyMatch(a -> a.name().equals(INJECT) || a.name().equals(INJECT_JAVAX));
                if (!alreadyAnnotated) {
                    for (Type paramType : ctor.parameterTypes()) {
                        String toClass = paramType.name().toString();
                        addDependency(fromClass, toClass, classIndex, deps);
                    }
                }
            }
        }

        List<DependencyModel> unique = deduplicate(deps);
        model.setDependencies(unique);

        log.info("ArchLens: dependency analysis complete — {} edges detected", unique.size());
    }

    private static void addDependency(String fromClass, String toClass,
                                      Map<String, ComponentCoordinate> classIndex,
                                      List<DependencyModel> deps) {
        ComponentCoordinate from = classIndex.get(fromClass);
        ComponentCoordinate to = classIndex.get(toClass);

        if (from == null || to == null) return;
        if (fromClass.equals(toClass)) return;
        deps.add(new DependencyModel(
                fromClass,
                toClass,
                from.layerId,
                from.subsystemId,
                to.layerId,
                to.subsystemId)
        );
    }

    /**
     * Builds a flat map, fully-qualified class name -> (layer, module) coordinate.
     * Covers module layers and shared layers.
     */
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

    private static List<DependencyModel> deduplicate(List<DependencyModel> deps) {
        Set<String> seen = new LinkedHashSet<>();
        List<DependencyModel> result = new ArrayList<>();
        for (DependencyModel d : deps) {
            String key = d.getFromClass() + " → " + d.getToClass();
            if (seen.add(key)) result.add(d);
        }
        return result;
    }

    private record ComponentCoordinate(String layerId, String subsystemId) {
    }
}
