package io.archlens.deployment.config;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Mirrors the complete {@code archlens.yaml} file structure.
 */
@Getter
public class ArchLensYamlConfig {

    private SystemConfig system;
    private SettingsConfig settings = new SettingsConfig();
    private Map<String, SubsystemDeclaration> subsystems = new LinkedHashMap<>();

    @JsonProperty("shared-layers")
    private Map<String, LayerConfig> sharedLayers = new LinkedHashMap<>();

    @JsonProperty("subsystem-defs")
    private Map<String, SubsystemDefinitionsConfig> subsystemDefinitions = new LinkedHashMap<>();

    @Getter
    @Setter
    public static class SystemConfig {
        private String id;
        private String name;
        private String description;
    }

    @Getter
    @Setter
    public static class SettingsConfig {
        @JsonProperty("fail-on-violation")
        private boolean failOnViolation = false;

        @JsonProperty("strict-matching")
        private boolean strictMatching = false;
    }

    @Getter
    @Setter
    public static class SubsystemDeclaration {
        private String name;
        private String description;
    }

    @Getter
    @Setter
    public static class SubsystemDefinitionsConfig {
        private Map<String, LayerConfig> layers = new LinkedHashMap<>();

        @JsonProperty("shared-layer-refs")
        private List<String> sharedLayerRefs = new ArrayList<>();
    }

    @Getter
    @Setter
    public static class LayerConfig {
        private String name;
        private String description;
        @JsonProperty("matches")
        private MatchCriteria matchCriteria = new MatchCriteria();
        private List<String> rules = Collections.emptyList();

        @JsonProperty("allowed-dependencies")
        private AllowedDeps allowedDependencies = new AllowedDeps();
    }

    @Getter
    @Setter
    public static class MatchCriteria {
        private List<String> packages = new ArrayList<>();
        private List<String> annotations = new ArrayList<>();
    }

    @Getter
    @Setter
    public static class AllowedDeps {
        private List<String> layers = new ArrayList<>();
        @JsonProperty("shared-layers")
        private List<String> sharedLayers = new ArrayList<>();
    }
}