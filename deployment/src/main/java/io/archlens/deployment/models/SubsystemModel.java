package io.archlens.deployment.models;

import io.archlens.deployment.config.ArchLensYamlConfig.SubsystemDeclaration;
import io.archlens.deployment.config.ArchLensYamlConfig.SubsystemDefinitionsConfig;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SubsystemModel {

    private String id;
    private String name;
    private String description;
    private List<LayerModel> layers = new ArrayList<>();
    private List<LayerModel> visibleSharedLayers = new ArrayList<>();
    private int violationCount = 0;

    public int getTotalComponentCount() { // method is used by serialization, do not remove
        return layers.stream().mapToInt(l -> l.getComponents().size()).sum();
    }

    public SubsystemModel(String id, SubsystemDeclaration declaration, SubsystemDefinitionsConfig definition) {
        this.id = id;
        this.name = declaration.getName();
        this.description = declaration.getDescription();

        this.layers = definition.getLayers().entrySet().stream()
                .map(e -> new LayerModel(e.getKey(), e.getValue(), false))
                .toList();
    }
}