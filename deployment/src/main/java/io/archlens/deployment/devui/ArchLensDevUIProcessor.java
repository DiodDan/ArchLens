package io.archlens.deployment.devui;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.archlens.deployment.builditem.ArchitectureModelBuildItem;
import io.archlens.deployment.models.ArchitectureModel;
import io.quarkus.deployment.IsDevelopment;
import io.quarkus.deployment.annotations.BuildStep;
import io.quarkus.devui.spi.page.CardPageBuildItem;
import io.quarkus.devui.spi.page.Page;
import lombok.extern.slf4j.Slf4j;

/**
 * Registers the ArchLens Dev UI card and injects the architecture model
 * as build-time data accessible from the Lit frontend component.
 */
@Slf4j
public class ArchLensDevUIProcessor {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @BuildStep(onlyIf = IsDevelopment.class)
    CardPageBuildItem createArchLensDevUICard(ArchitectureModelBuildItem modelBuildItem) {
        ArchitectureModel model = modelBuildItem.getModel();

        CardPageBuildItem card = new CardPageBuildItem();

        addModelDataToCard(model, card);

        card.addPage(Page.webComponentPageBuilder()
                .title("Architecture")
                .componentLink("qwc-archlens-page.js")
                .icon("font-awesome-solid:diagram-project")
                .staticLabel(model.getAppName()));

        log.info("ArchLens: Dev UI card registered — {} modules, {} total components",
                model.getSubsystems().size(), model.getTotalComponentCount());

        return card;
    }

    private static void addModelDataToCard(ArchitectureModel model, CardPageBuildItem card) {
        try {
            Object modelAsMap = MAPPER.convertValue(model, Object.class);
            card.addBuildTimeData("architectureModel", modelAsMap);
        } catch (Exception e) {
            log.error("ArchLens: failed to serialize architecture model to JSON", e);
            card.addBuildTimeData("architectureModel", java.util.Map.of(
                    "appName", "Error — see build logs",
                    "appDescription", e.getMessage(),
                    "modules", java.util.List.of(),
                    "sharedLayers", java.util.List.of(),
                    "unclassifiedComponents", java.util.List.of(),
                    "dependencies", java.util.List.of(),
                    "violations", java.util.List.of()
            ));
        }
    }
}
