package io.archlens.annotations;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Explicitly assigns a class to an architectural layer.
 *
 * <p>This annotation takes priority over all auto-discovery rules configured in {@code archlens.yaml}.
 * Use it for classes that cannot be reliably discovered by annotation or package patterns.
 *
 * <pre>{@code
 * @ArchComponent(
 *     layer = "Service",
 *     subsystem = "HTTP API",
 *     description = "Handles user authentication and token management"
 * )
 * @ApplicationScoped
 * public class AuthService { ... }
 * }</pre>
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.CLASS)
public @interface ArchComponent {

    /**
     * The name of the layer this class belongs to.
     * Must match a layer id defined in {@code archlens.yaml}.
     */
    String layer();

    /**
     * The subsystem this class belongs to.
     * Must match a subsystem id defined in {@code archlens.yaml}.
     */
    String subsystem() default "";

    /**
     * Human-readable description of what this specific class does.
     * Displayed in the Dev UI component detail view.
     */
    String description() default "";
}
