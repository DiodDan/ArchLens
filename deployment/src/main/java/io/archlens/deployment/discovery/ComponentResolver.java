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
 * If a class matches rules in more than one layer, it is assigned to the first
 * matching layer and flagged as ambiguous so the user can resolve it with
 * {@code @ArchComponent}.
 */
@Slf4j
public class ComponentResolver {

    private static final DotName ARCH_COMPONENT =
            DotName.createSimple("io.archlens.annotations.ArchComponent");

    /**
     * Prefixes of classes we always skip (framework internals).
     */
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

        List<SubsystemModel> modules = buildSubsystemSkeleton(config);
        List<LayerModel> shared = buildSharedSkeleton(config);
        model.setSubsystems(modules);
        model.setSharedLayers(shared);

        Map<String, ClassAssignment> assignments = new LinkedHashMap<>();

        scanArchLensAnnotatedClasses(index, model, assignments);

        scanComponentsWithMatchCriteria(index, model, assignments, config);

        log.debug("ArchLens: scan complete — {} modules, {} shared layers, {} unclassified",
                model.getSubsystems().size(), model.getSharedLayers().size(),
                model.getUnclassifiedComponents().size());
        return model;
    }

    /**
     *
     * @param index       source of components
     * @param model       ArchitectureModel for scanning process
     * @param assignments map in which resolved components will be added
     * @param config      configuration for retrieving matchCriteria
     */
    private static void scanComponentsWithMatchCriteria(IndexView index, ArchitectureModel model, Map<String, ClassAssignment> assignments, ArchLensYamlConfig config) {
        for (ClassInfo classInfo : index.getKnownClasses()) {
            DotName className = classInfo.name();

            if (assignments.containsKey(className.toString())) continue;
            if (shouldSkip(className.toString())) continue;

            List<LayerResolution> matches = new ArrayList<>();

            // Check shared layers
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
                // Only flag as unclassified if it looks like an application class
                if (isLikelyApplicationClass(classInfo)) {
                    ComponentModel comp = new ComponentModel(className, "", ComponentSource.UNCLASSIFIED, false);
                    model.getUnclassifiedComponents().add(comp);
                }
                continue;
            }

            boolean ambiguous = matches.size() > 1;
            LayerResolution winner = matches.get(0);
            ComponentSource source = determineSource(classInfo, findLayerCfgForResolution(config, winner));

            ComponentModel comp = new ComponentModel(className, "", source, ambiguous);
            winner.layer.getComponents().add(comp);
            assignments.put(className.toString(), new ClassAssignment(winner.moduleName, winner.layerName));

            if (ambiguous) {
                log.debug("ArchLens: {} matched {} layers — assigned to first match '{}'. " +
                        "Add @ArchComponent to resolve ambiguity.", className, matches.size(), winner.layerName);
            }
        }
    }

    /**
     * Scans components annotated with {@link io.archlens.annotations.ArchComponent} and assigns them to layers based on the annotation values.
     *
     * @param index       source of components
     * @param model       ArchlensModel for scanning process
     * @param assignments map in which resolved components will be added
     */
    private static void scanArchLensAnnotatedClasses(IndexView index, ArchitectureModel model, Map<String, ClassAssignment> assignments) {
        for (AnnotationInstance annotationInstance : index.getAnnotations(ARCH_COMPONENT)) {
            if (annotationInstance.target().kind() != AnnotationTarget.Kind.CLASS) continue;

            ClassInfo classInfo = annotationInstance.target().asClass();
            DotName className = classInfo.name();
            String layerName = annotationInstance.value("layer") != null ? annotationInstance.value("layer").asString() : "";
            String moduleName = annotationInstance.value("module") != null ? annotationInstance.value("module").asString() : "";
            String description = annotationInstance.value("description") != null ? annotationInstance.value("description").asString() : "";

            ComponentModel comp = new ComponentModel(className, description, ComponentSource.MANUAL, false);

            // Resolve the layer from the model
            LayerResolution res = resolveLayer(model, layerName, moduleName);
            if (res == null) {
                log.warn("ArchLens: @ArchComponent on {} references unknown layer '{}' (module: '{}') — " +
                        "placing in unclassified", className, layerName, moduleName);
                model.addUnclassifiedComponent(comp);
            } else {
                res.layer.getComponents().add(comp);
                assignments.put(className.toString(), new ClassAssignment(res.moduleName, layerName));
            }
        }
    }

    private static List<SubsystemModel> buildSubsystemSkeleton(ArchLensYamlConfig config) {
        return config.getSubsystemDefinitions().entrySet().stream()
                .map(defenitionEntry -> {
                    SubsystemDeclaration declaration = config.getSubsystems().get(defenitionEntry.getKey());
                    return new SubsystemModel(defenitionEntry.getKey(), declaration, defenitionEntry.getValue());
                }).toList();
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

    private static boolean hasAnnotationMatch(ClassInfo classInfo, MatchCriteria matchCriteria) {
        return matchCriteria.getAnnotations().stream()
                .anyMatch(annotationFqn ->
                        classInfo.hasAnnotation(DotName.createSimple(annotationFqn))
                );
    }

    private static boolean hasPackageMatch(ClassInfo classInfo, MatchCriteria matchCriteria) {
        return matchCriteria.getPackages().stream()
                .anyMatch(pattern ->
                        matchesGlob(classInfo.name().toString(), pattern)
                );
    }

    /**
     * Converts a glob pattern like {@code *.service.*} to a regex and matches
     * against the fully-qualified class name.
     *
     * <p>{@code *} matches any sequence of characters (including dots).
     */
    static boolean matchesGlob(String className, String pattern) {
        // Escape dots in the pattern, then replace * with .*
        String regex = pattern
                .replace(".", "\\.")
                .replace("*", ".*");
        return className.matches(regex);
    }

    private static ComponentSource determineSource(ClassInfo classInfo, LayerConfig layerConfig) {
        if (layerConfig == null) return ComponentSource.PACKAGE;
        if (layerConfig.getMatchCriteria() != null && hasAnnotationMatch(classInfo, layerConfig.getMatchCriteria())) {
            return ComponentSource.ANNOTATION;
        }
        return ComponentSource.PACKAGE;
    }

    private static LayerResolution resolveLayer(ArchitectureModel model, String layerName, String subsystemName) {
        // Shared layers
        for (LayerModel sl : model.getSharedLayers()) {
            if (sl.getId().equalsIgnoreCase(layerName)) {
                if (subsystemName.isBlank() || subsystemName.equalsIgnoreCase("shared")) {
                    return new LayerResolution(sl, null, sl.getId());
                }
            }
        }
        // Subsystem layers
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

    private static SubsystemDefinitionsConfig findSubsystemDefinitionConfig(ArchLensYamlConfig config, String name) {
        return config.getSubsystemDefinitions().getOrDefault(name, null);
    }

    private static LayerConfig findSharedLayerConfig(ArchLensYamlConfig config, String name) {
        return config.getSharedLayers().getOrDefault(name, null);
    }

    private static LayerConfig findLayerConfig(SubsystemDefinitionsConfig subsystemModelConfig, String name) {
        return subsystemModelConfig.getLayers().getOrDefault(name, null);
    }

    private static LayerConfig findLayerCfgForResolution(ArchLensYamlConfig config, LayerResolution layerResolution) {
        if (layerResolution.moduleName == null) return findSharedLayerConfig(config, layerResolution.layerName);
        SubsystemDefinitionsConfig subsystemDefinitionConfig = findSubsystemDefinitionConfig(config, layerResolution.moduleName);
        return subsystemDefinitionConfig != null ? findLayerConfig(subsystemDefinitionConfig, layerResolution.layerName) : null;
    }

    private static boolean shouldSkip(String className) {
        for (String prefix : SKIP_PREFIXES) {
            if (className.startsWith(prefix)) return true;
        }
        return false;
    }

    private static boolean isLikelyApplicationClass(ClassInfo classInfo) {
        // remove synthetic entities
        return !classInfo.name().toString().contains("$");
    }

    private record LayerResolution(LayerModel layer, String moduleName, String layerName) {
    }

    private record ClassAssignment(String moduleName, String layerName) {
    }
}
