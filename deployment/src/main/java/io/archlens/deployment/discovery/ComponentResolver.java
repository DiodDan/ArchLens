package io.archlens.deployment.discovery;

import io.archlens.deployment.config.ArchLensYamlConfig;
import io.archlens.deployment.config.ArchLensYamlConfig.LayerConfig;
import io.archlens.deployment.config.ArchLensYamlConfig.MatchCriteria;
import io.archlens.deployment.config.ArchLensYamlConfig.SubsystemDeclaration;
import io.archlens.deployment.config.ArchLensYamlConfig.SubsystemDefinitionsConfig;
import io.archlens.deployment.models.ArchitectureModel;
import io.archlens.deployment.models.ComponentModel;
import io.archlens.deployment.models.LayerModel;
import io.archlens.deployment.models.SubsystemModel;
import io.archlens.deployment.models.enums.ComponentSource;
import io.archlens.deployment.models.enums.ComponentType;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.jboss.jandex.*;

/**
 * Scans all application classes and assigns each to an architectural layer.
 *
 * <h2>Ambiguity handling:</h2>
 * If a class matches rules in more than one layer it is assigned to the first
 * matching layer and flagged as ambiguous so the user can resolve it with
 * {@code @ArchComponent}.
 */
@Slf4j
public class ComponentResolver {

    private static final DotName ARCH_COMPONENT =
            DotName.createSimple("io.archlens.annotations.ArchComponent");

    private static final List<String> SKIP_PREFIXES = List.of(
            "java.", "javax.", "jakarta.", "sun.", "com.sun.",
            "org.jboss.", "io.quarkus.", "io.smallrye.", "io.vertx.",
            "io.netty.", "com.fasterxml.", "org.hibernate.", "org.eclipse.",
            "io.archlens.", "org.agroal.", "com.arjuna.", "org.graalvm."
    );

    private ComponentResolver() {
    }

    /**
     * Builds the full {@link ArchitectureModel} from the Jandex index and config.
     */
    public static ArchitectureModel scan(IndexView index, ArchLensYamlConfig config) {
        ArchitectureModel model = new ArchitectureModel();
        model.setAppName(config.getSystem().getName());
        model.setAppDescription(config.getSystem().getDescription());

        model.setSubsystems(buildSubsystemSkeleton(config));
        model.setSharedLayers(buildSharedSkeleton(config));

        Map<String, ClassAssignment> assignments = new LinkedHashMap<>();

        scanArchLensAnnotatedClasses(index, model, assignments);
        scanComponentsWithMatchCriteria(index, model, assignments, config);

        log.debug("ArchLens: scan complete — {} subsystems, {} shared layers, {} unclassified",
                model.getSubsystems().size(),
                model.getSharedLayers().size(),
                model.getUnclassifiedComponents().size());
        return model;
    }

    private static void scanArchLensAnnotatedClasses(
            IndexView index,
            ArchitectureModel model,
            Map<String, ClassAssignment> assignments) {

        for (AnnotationInstance ai : index.getAnnotations(ARCH_COMPONENT)) {
            if (ai.target().kind() != AnnotationTarget.Kind.CLASS) continue;

            ClassInfo classInfo = ai.target().asClass();

            if(classInfo.nestingType() == ClassInfo.NestingType.ANONYMOUS) continue;

            DotName className = classInfo.name();

            String layerName = ai.value("layer") != null ? ai.value("layer").asString() : "";
            String subsystemName = ai.value("subsystem") != null ? ai.value("subsystem").asString() : "";
            String description = ai.value("description") != null ? ai.value("description").asString() : "";

            ComponentModel comp = new ComponentModel(
                    className, description, ComponentSource.MANUAL, false,
                    resolveComponentType(classInfo));

            LayerResolution res = resolveLayer(model, layerName, subsystemName);
            if (res == null) {
                log.warn("ArchLens: @ArchComponent on {} references unknown layer '{}' (subsystem: '{}') — " +
                        "placing in unclassified", className, layerName, subsystemName);
                model.addUnclassifiedComponent(comp);
            } else {
                res.layer.getComponents().add(comp);
                assignments.put(className.toString(), new ClassAssignment(res.subsystemName, layerName));
            }
        }
    }

    private static void scanComponentsWithMatchCriteria(
            IndexView index,
            ArchitectureModel model,
            Map<String, ClassAssignment> assignments,
            ArchLensYamlConfig config) {

        for (ClassInfo classInfo : index.getKnownClasses()) {
            DotName className = classInfo.name();

            if (assignments.containsKey(className.toString())) continue;
            if (shouldSkip(className.toString())) continue;
            if(classInfo.nestingType() == ClassInfo.NestingType.ANONYMOUS) continue;

            List<LayerResolution> matches = new ArrayList<>();

            // Check shared layers first
            for (LayerModel sl : model.getSharedLayers()) {
                LayerConfig cfg = findSharedLayerConfig(config, sl.getId());
                if (cfg != null && matchesLayer(classInfo, cfg)) {
                    matches.add(new LayerResolution(sl, null, sl.getId()));
                }
            }

            // Check subsystem layers
            for (SubsystemModel mod : model.getSubsystems()) {
                SubsystemDefinitionsConfig modCfg = findSubsystemDefinitionConfig(config, mod.getId());
                if (modCfg == null) continue;
                for (LayerModel layer : mod.getLayers()) {
                    LayerConfig layerCfg = findLayerConfig(modCfg, layer.getId());
                    if (layerCfg != null && matchesLayer(classInfo, layerCfg)) {
                        matches.add(new LayerResolution(layer, mod.getId(), layer.getId()));
                    }
                }
            }

            if (matches.isEmpty()) {
                if (isLikelyApplicationClass(classInfo)) {
                    ComponentModel comp = new ComponentModel(
                            className, "", ComponentSource.UNCLASSIFIED, false,
                            resolveComponentType(classInfo));
                    model.getUnclassifiedComponents().add(comp);
                }
                continue;
            }

            boolean ambiguous = matches.size() > 1;
            LayerResolution winner = matches.get(0);
            ComponentSource source = determineSource(classInfo, findLayerCfgForResolution(config, winner));

            ComponentModel comp = new ComponentModel(
                    className, "", source, ambiguous,
                    resolveComponentType(classInfo));

            winner.layer.getComponents().add(comp);
            assignments.put(className.toString(), new ClassAssignment(winner.subsystemName, winner.layerName));

            if (ambiguous) {
                log.debug("ArchLens: {} matched {} layers — assigned to first match '{}'. " +
                        "Add @ArchComponent to resolve ambiguity.", className, matches.size(), winner.layerName);
            }
        }
    }

    static ComponentType resolveComponentType(ClassInfo classInfo) {
        if (classInfo.isAnnotation()) return ComponentType.ANNOTATION;
        if (classInfo.isInterface()) return ComponentType.INTERFACE;
        if (classInfo.isEnum()) return ComponentType.ENUM;

        if (classInfo.superName() != null
                && "java.lang.Record".equals(classInfo.superName().toString())) {
            return ComponentType.RECORD;
        }
        return ComponentType.CLASS;
    }

    private static List<SubsystemModel> buildSubsystemSkeleton(ArchLensYamlConfig config) {
        return config.getSubsystemDefinitions().entrySet().stream()
                .map(entry -> {
                    SubsystemDeclaration declaration = config.getSubsystems().get(entry.getKey());
                    return new SubsystemModel(entry.getKey(), declaration, entry.getValue());
                })
                .toList();
    }

    private static List<LayerModel> buildSharedSkeleton(ArchLensYamlConfig config) {
        return config.getSharedLayers().entrySet().stream()
                .map(e -> new LayerModel(e.getKey(), e.getValue(), true))
                .toList();
    }

    private static boolean matchesLayer(ClassInfo classInfo, LayerConfig layerConfig) {
        MatchCriteria m = layerConfig.getMatchCriteria();
        if (m == null) return false;
        return hasAnnotationMatch(classInfo, m) || hasPackageMatch(classInfo, m);
    }

    private static boolean hasAnnotationMatch(ClassInfo classInfo, MatchCriteria criteria) {
        return criteria.getAnnotations().stream()
                .anyMatch(fqn -> classInfo.hasAnnotation(DotName.createSimple(fqn)));
    }

    private static boolean hasPackageMatch(ClassInfo classInfo, MatchCriteria criteria) {
        return criteria.getPackages().stream()
                .anyMatch(pattern -> matchesGlob(classInfo.name().toString(), pattern));
    }

    /**
     * Converts a glob pattern like {@code *.service.*} to a regex and matches
     * against the fully-qualified class name.
     *
     * <p>{@code *} matches any sequence of characters (including dots).
     */
    static boolean matchesGlob(String className, String pattern) {
        String regex = pattern
                .replace(".", "\\.")
                .replace("**", "___DOUBLE_STAR___")
                .replace("*", "[^.]+")
                .replace("___DOUBLE_STAR___", ".*");

        return className.matches("^" + regex + "$");
    }

    private static ComponentSource determineSource(ClassInfo classInfo, LayerConfig layerConfig) {
        if (layerConfig == null) return ComponentSource.PACKAGE;
        if (layerConfig.getMatchCriteria() != null
                && hasAnnotationMatch(classInfo, layerConfig.getMatchCriteria())) {
            return ComponentSource.ANNOTATION;
        }
        return ComponentSource.PACKAGE;
    }


    private static LayerResolution resolveLayer(ArchitectureModel model, String layerName, String subsystemName) {
        for (LayerModel sl : model.getSharedLayers()) {
            if (sl.getId().equalsIgnoreCase(layerName)) {
                if (subsystemName.isBlank() || subsystemName.equalsIgnoreCase("shared")) {
                    return new LayerResolution(sl, null, sl.getId());
                }
            }
        }
        for (SubsystemModel mod : model.getSubsystems()) {
            if (!subsystemName.isBlank() && !mod.getId().equalsIgnoreCase(subsystemName)) continue;
            for (LayerModel layer : mod.getLayers()) {
                if (layer.getId().equalsIgnoreCase(layerName)) {
                    return new LayerResolution(layer, mod.getId(), layer.getId());
                }
            }
        }
        return null;
    }

    private static SubsystemDefinitionsConfig findSubsystemDefinitionConfig(ArchLensYamlConfig config, String id) {
        return config.getSubsystemDefinitions().getOrDefault(id, null);
    }

    private static LayerConfig findSharedLayerConfig(ArchLensYamlConfig config, String id) {
        return config.getSharedLayers().getOrDefault(id, null);
    }

    private static LayerConfig findLayerConfig(SubsystemDefinitionsConfig subsystemCfg, String id) {
        return subsystemCfg.getLayers().getOrDefault(id, null);
    }

    private static LayerConfig findLayerCfgForResolution(ArchLensYamlConfig config, LayerResolution res) {
        if (res.subsystemName == null) return findSharedLayerConfig(config, res.layerName);
        SubsystemDefinitionsConfig subsystemCfg = findSubsystemDefinitionConfig(config, res.subsystemName);
        return subsystemCfg != null ? findLayerConfig(subsystemCfg, res.layerName) : null;
    }

    private static boolean shouldSkip(String className) {
        for (String prefix : SKIP_PREFIXES) {
            if (className.startsWith(prefix)) return true;
        }
        return false;
    }

    private static boolean isLikelyApplicationClass(ClassInfo classInfo) {
        return classInfo.nestingType() != ClassInfo.NestingType.ANONYMOUS;
    }

    private record LayerResolution(LayerModel layer, String subsystemName, String layerName) {
    }

    private record ClassAssignment(String subsystemName, String layerName) {
    }
}
