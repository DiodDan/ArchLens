package io.archlens.deployment.models;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * Root architecture model — the complete picture of the application's structure.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Setter
@Getter
public class ArchitectureModel {

    private String id;
    private String appName = "(No archlens.yaml found)";
    private String appDescription = "Create an archlens.yaml file in your project root to get started.";
    private List<SubsystemModel> subsystems = new ArrayList<>();
    private List<LayerModel> sharedLayers = new ArrayList<>();
    private List<ComponentModel> unclassifiedComponents = new ArrayList<>();
    private List<DependencyModel> dependencies = new ArrayList<>();
    private List<ViolationModel> violations = new ArrayList<>();

    public int getTotalComponentCount() {
        int count = subsystems.stream()
                .flatMap(subsystem -> subsystem.getLayers().stream())
                .mapToInt(layer -> layer.getComponents().size())
                .sum();
        count += sharedLayers.stream().mapToInt(l -> l.getComponents().size()).sum();
        count += unclassifiedComponents.size();
        return count;
    }

    public int getTotalViolationCount() { // method is used by serialization and must be removed or renamed
        return violations.size();
    }

    public void addUnclassifiedComponent(ComponentModel component) {
        this.unclassifiedComponents.add(component);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder(1024);
        sb.append("ArchitectureModel\n");
        sb.append("  appName: ").append(appName).append("\n");
        if (appDescription != null && !appDescription.isBlank()) {
            sb.append("  appDescription: ").append(appDescription).append("\n");
        }
        sb.append("  subsystems: ").append(subsystems.size()).append("\n");
        for (SubsystemModel subsystem : subsystems) {
            sb.append("    - ").append(subsystem.getName()).append(" (")
                    .append(subsystem.getId()).append(")\n");
            sb.append("      layers: ").append(subsystem.getLayers().size()).append("\n");
            for (LayerModel layer : subsystem.getLayers()) {
                sb.append("        * ").append(layer.getName()).append(" (")
                        .append(layer.getId()).append(")\n");
                sb.append("          components: ").append(layer.getComponents().size()).append("\n");
                for (ComponentModel comp : layer.getComponents()) {
                    sb.append("            - ").append(comp.getClassName());
                    if (comp.getDescription() != null && !comp.getDescription().isBlank()) {
                        sb.append(" — ").append(comp.getDescription());
                    }
                    if (comp.isAmbiguous()) {
                        sb.append(" [ambiguous]");
                    }
                    sb.append("\n");
                }
            }
        }
        sb.append("  sharedLayers: ").append(sharedLayers.size()).append("\n");
        for (LayerModel layer : sharedLayers) {
            sb.append("    - ").append(layer.getName()).append(" (")
                    .append(layer.getId()).append(")\n");
            sb.append("      components: ").append(layer.getComponents().size()).append("\n");
            for (ComponentModel comp : layer.getComponents()) {
                sb.append("        * ").append(comp.getClassName());
                if (comp.getDescription() != null && !comp.getDescription().isBlank()) {
                    sb.append(" — ").append(comp.getDescription());
                }
                if (comp.isAmbiguous()) {
                    sb.append(" [ambiguous]");
                }
                sb.append("\n");
            }
        }
        sb.append("  unclassifiedComponents: ").append(unclassifiedComponents.size()).append("\n");
        for (ComponentModel comp : unclassifiedComponents) {
            sb.append("    - ").append(comp.getClassName());
            if (comp.getDescription() != null && !comp.getDescription().isBlank()) {
                sb.append(" — ").append(comp.getDescription());
            }
            if (comp.isAmbiguous()) {
                sb.append(" [ambiguous]");
            }
            sb.append("\n");
        }
        sb.append("  dependencies: ").append(dependencies.size()).append("\n");
        sb.append("  violations: ").append(violations.size()).append("\n");
        return sb.toString();
    }
}
