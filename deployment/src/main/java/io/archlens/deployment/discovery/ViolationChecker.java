package io.archlens.deployment.discovery;

import io.archlens.deployment.models.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;

/**
 * Validates every resolved dependency against the {@code allowed-dependencies} rules
 * declared in {@code archlens.yaml}.
 */
@Slf4j
public class ViolationChecker {

    private ViolationChecker() {
    }

    public static void check(ArchitectureModel model) {
        Map<String, LayerModel> layerIndex = buildLayerIndex(model);
        List<ViolationModel> violations = new ArrayList<>();

        for (DependencyModel dep : model.getDependencies()) {
            String message = detectViolation(dep, layerIndex);
            if (message == null) continue;

            dep.setViolation(true);

            ViolationModel v = new ViolationModel();
            v.setFromClass(dep.getFromClass());
            v.setToClass(dep.getToClass());
            v.setFromLayer(dep.getFromLayer());
            v.setFromSubsystem(dep.getFromSubsystem());
            v.setToLayer(dep.getToLayer());
            v.setToSubsystem(dep.getToSubsystem());
            v.setViolatedRule(message);
            violations.add(v);

            incrementLayerViolationCount(dep.getFromSubsystem(), dep.getFromLayer(), model);
            if (dep.getFromSubsystem() != null) {
                incrementSubsystemViolationCount(dep.getFromSubsystem(), model);
            }
        }

        model.setViolations(violations);

        if (violations.isEmpty()) {
            log.info("ArchLens: no architectural violations detected");
        } else {
            log.warn("ArchLens: {} architectural violation(s) detected:", violations.size());
            for (ViolationModel v : violations) {
                log.warn(v.getViolatedRule());
            }
        }
    }

    private static String detectViolation(DependencyModel dep, Map<String, LayerModel> layerIndex) {
        String fromSubsystem = dep.getFromSubsystem();
        String fromLayer = dep.getFromLayer();
        String toSubsystem = dep.getToSubsystem();
        String toLayer = dep.getToLayer();


        LayerModel origin = layerIndex.get(layerKey(fromSubsystem, fromLayer));
        if (origin == null) return null;

        if (toSubsystem == null) {
            if (!origin.getAllowedSharedLayerIds().contains(toLayer)) {
                return String.format(
                        "Layer '%s' (subsystem '%s') depends on shared layer '%s' which is not listed in allowed-dependencies.shared-layers",
                        fromLayer, fromSubsystem, toLayer);
            }
            return null;
        }

        if (fromSubsystem == null) {
            return String.format(
                    "Shared layer '%s' has a direct dependency on layer '%s' in subsystem '%s'" +
                            " — shared layers can't depend on subsystems.",
                    fromLayer, toLayer, toSubsystem);
        }

        if (!fromSubsystem.equals(toSubsystem)) {
            return String.format(
                    "Layer '%s' (subsystem '%s') has a direct dependency on layer '%s' in subsystem '%s'" +
                            " — cross-subsystem dependencies must go through shared layers",
                    fromLayer, fromSubsystem, toLayer, toSubsystem);
        }

        if (!origin.getAllowedLayerIds().contains(toLayer)) {
            return String.format(
                    "Layer '%s' depends on layer '%s' within subsystem '%s'" +
                            " which is not listed in allowed-dependencies.layers",
                    fromLayer, toLayer, fromSubsystem);
        }

        return null;
    }

    private static void incrementLayerViolationCount(String subsystemId, String layerId, ArchitectureModel model) {
        if (subsystemId == null) {
            model.getSharedLayers().stream()
                    .filter(l -> l.getId().equals(layerId))
                    .findFirst()
                    .ifPresent(l -> l.setViolationCount(l.getViolationCount() + 1));
        } else {
            model.getSubsystems().stream()
                    .filter(s -> s.getId().equals(subsystemId))
                    .flatMap(s -> s.getLayers().stream())
                    .filter(l -> l.getId().equals(layerId))
                    .findFirst()
                    .ifPresent(l -> l.setViolationCount(l.getViolationCount() + 1));
        }
    }

    private static void incrementSubsystemViolationCount(String subsystemId, ArchitectureModel model) {
        model.getSubsystems().stream()
                .filter(s -> s.getId().equals(subsystemId))
                .findFirst()
                .ifPresent(s -> s.setViolationCount(s.getViolationCount() + 1));
    }

    private static Map<String, LayerModel> buildLayerIndex(ArchitectureModel model) {
        Map<String, LayerModel> index = new HashMap<>();
        for (SubsystemModel sub : model.getSubsystems()) {
            for (LayerModel layer : sub.getLayers()) {
                index.put(layerKey(sub.getId(), layer.getId()), layer);
            }
        }
        for (LayerModel shared : model.getSharedLayers()) {
            index.put(layerKey(null, shared.getId()), shared);
        }
        return index;
    }

    private static String layerKey(String subsystemId, String layerId) {
        return (subsystemId != null ? subsystemId : "__shared__") + "::" + layerId;
    }
}
