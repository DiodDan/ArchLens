package io.archlens.deployment.models;

import io.archlens.deployment.models.enums.ComponentSource;
import lombok.Getter;
import lombok.Setter;
import org.jboss.jandex.DotName;

@Getter
@Setter
public class ComponentModel {

    private String className;
    private String simpleClassName;
    private String packageName;
    private String description;
    private ComponentSource source;
    private boolean ambiguous;
    private String subsystemId;
    private String layerId;

    public ComponentModel(DotName className, String description, ComponentSource source, boolean ambiguous) {
        this.className = className.toString();
        this.simpleClassName = className.local();
        this.packageName = className.packagePrefix();
        this.description = description;
        this.source = source;
        this.ambiguous = ambiguous;
    }
}
