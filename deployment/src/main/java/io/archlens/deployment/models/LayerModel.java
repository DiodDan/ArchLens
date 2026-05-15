package io.archlens.deployment.models;

import io.archlens.deployment.config.ArchLensYamlConfig;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class LayerModel {

    private String id;
    private String name;
    private String description;
    private List<String> rules = new ArrayList<>();
    private List<String> allowedLayerIds = new ArrayList<>();
    private List<String> allowedSharedLayerIds = new ArrayList<>();
    private List<ComponentModel> components = new ArrayList<>();
    private boolean shared = false;
    private int violationCount = 0;

    public LayerModel(String id, ArchLensYamlConfig.LayerConfig layerConfig, boolean shared) {
        this.id = id;
        this.name = layerConfig.getName();
        this.description = layerConfig.getDescription();
        this.rules = layerConfig.getRules();
        this.allowedSharedLayerIds = layerConfig.getAllowedDependencies().getSharedLayers();
        this.allowedLayerIds = layerConfig.getAllowedDependencies().getLayers();
        this.shared = shared;
    }
}
