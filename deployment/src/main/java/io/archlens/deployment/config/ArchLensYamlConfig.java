package io.archlens.deployment.config;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import java.util.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Mirrors the complete {@code archlens.yaml} file structure.
 */
@Getter
public class ArchLensYamlConfig {

    @JsonPropertyDescription(
            "Top-level metadata that identifies the software system.")
    private SystemConfig system;

    @JsonPropertyDescription(
            "Registry that declares every subsystem in the architecture. "
                    + "Full layer definitions belong in 'subsystem-defs'.")
    private Map<String, SubsystemDeclaration> subsystems = new LinkedHashMap<>();

    @JsonProperty("shared-layers")
    @JsonPropertyDescription(
            "Reusable layer definitions that can be composed into multiple subsystems. "
                    + "Subsystem definitions reference these entries by key via 'shared-layer-refs'.")
    private Map<String, LayerConfig> sharedLayers = new LinkedHashMap<>();

    @JsonProperty("subsystem-defs")
    @JsonPropertyDescription(
            "Full architectural definitions for every subsystem declared under 'subsystems'. "
                    + "Each key must match a subsystem ID declared there.")
    private Map<String, SubsystemDefinitionsConfig> subsystemDefinitions = new LinkedHashMap<>();

    // -------------------------------------------------------------------------

    @Getter
    @Setter
    public static class SystemConfig {

        @JsonPropertyDescription(
                "Short, machine-readable identifier for this system "
                        + "(e.g. 'order-service'). Used as a stable key in reports and tooling.")
        private String id;

        @JsonPropertyDescription("Human-readable display name of the system (e.g. 'Order Service').")
        private String name;

        @JsonPropertyDescription("Optional free-text description of the system's purpose and boundaries.")
        private String description;
    }

    // -------------------------------------------------------------------------

    @Getter
    @Setter
    public static class SubsystemDeclaration {

        @JsonPropertyDescription("Human-readable display name of this subsystem.")
        private String name;

        @JsonPropertyDescription("Optional description of the subsystem's responsibilities and scope.")
        private String description;
    }

    // -------------------------------------------------------------------------

    @Getter
    @Setter
    public static class SubsystemDefinitionsConfig {

        @JsonPropertyDescription(
                "Map of layer identifiers to their definitions for this subsystem. "
                        + "Each key is a layer ID that can be referenced in 'allowed-dependencies'. "
                        + "Layers defined here are private to this subsystem.")
        private Map<String, LayerConfig> layers = new LinkedHashMap<>();
    }

    // -------------------------------------------------------------------------

    @Getter
    @Setter
    public static class LayerConfig {

        @JsonPropertyDescription("Human-readable display name of this layer (e.g. 'Controller').")
        private String name;

        @JsonPropertyDescription("Optional description of this layer's architectural role and responsibilities.")
        private String description;

        @JsonProperty("matches")
        @JsonPropertyDescription(
                "Criteria used to assign classes to this layer. "
                        + "A class is placed in the layer when it matches at least one package pattern "
                        + "or carries at least one of the listed annotations.")
        private MatchCriteria matchCriteria = new MatchCriteria();

        @JsonPropertyDescription(
                "List of architectural rule identifiers applied to classes in this layer. "
                        + "Rules are just human readable strings. Try to write direct rules to understand if component is part of this layer")
        private List<String> rules = Collections.emptyList();

        @JsonProperty("allowed-dependencies")
        @JsonPropertyDescription(
                "Declares which other layers this layer is permitted to depend on. "
                        + "Any dependency not listed here is flagged as a violation.")
        private AllowedDeps allowedDependencies = new AllowedDeps();
    }

    // -------------------------------------------------------------------------

    @Getter
    @Setter
    public static class MatchCriteria {

        @JsonPropertyDescription(
                "Ant/glob-style package patterns whose classes are assigned to this layer "
                        + "(e.g. 'com.example.domain.*', 'com.example.**.model'). "
                        + "A trailing '.*' matches only direct children; '.**' matches all descendants.")
        private List<String> packages = new ArrayList<>();

        @JsonPropertyDescription(
                "Fully-qualified annotation class names (or patterns) whose presence on a class " +
                        "assigns it to this layer (e.g. 'jakarta.persistence.Entity').")
        private List<String> annotations = new ArrayList<>();
    }

    // -------------------------------------------------------------------------

    @Getter
    @Setter
    public static class AllowedDeps {

        @JsonPropertyDescription("Keys of sibling layers within the same subsystem that this layer may depend on.")
        private List<String> layers = new ArrayList<>();

        @JsonProperty("shared-layers")
        @JsonPropertyDescription("Keys of shared layers (from the top-level 'shared-layers' section) that this layer may depend on. ")
        private List<String> sharedLayers = new ArrayList<>();
    }
}