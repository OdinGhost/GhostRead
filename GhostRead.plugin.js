/**
 * @name GhostRead
 * @author Azazel
 * @version 0.6.0
 * @description Experimental read acknowledgment blocking for Discord.
 */

module.exports = class GhostRead {
    constructor() {
        this.id = "GhostRead";
        this.active = false;
        this.hooks = 0;
        this.blocked = 0;
        this.originalFetch = null;
        this.fetchWrapper = null;
    }

    start() {
        this.deactivate();
        this.blocked = 0;
        console.log("[GhostRead] v0.6.0 ready");
    }

    stop() {
        this.deactivate();
    }

    isReadRequest(url, method) {
        if (!this.active) return false;

        const verb = String(method || "GET").toUpperCase();

        if (!["POST", "PUT", "PATCH"].includes(verb)) {
            return false;
        }

        let path;

        try {
            path = new URL(
                String(url),
                "https://discord.com"
            ).pathname;
        } catch {
            return false;
        }

        const patterns = [
            /\/channels\/\d+\/messages\/[^/]+\/ack\/?$/,
            /\/channels\/\d+\/ack\/?$/,
            /\/read-states\/ack\/?$/,
            /\/read-states\/[^/]+\/ack\/?$/,
            /\/guilds\/\d+\/ack\/?$/
        ];

        return patterns.some(pattern => pattern.test(path));
    }

    recordBlock(source) {
        this.blocked++;

        console.log(
            "[GhostRead] Read acknowledgment blocked",
            "Source:",
            source,
            "Total:",
            this.blocked
        );
    }

    installHttpHooks() {
        const methods = ["post", "put", "patch"];
        const seen = new WeakMap();

        const modules = BdApi.Webpack.getModules(
            m => {
                if (!m || typeof m !== "object") {
                    return false;
                }

                return (
                    typeof m.get === "function" &&
                    typeof m.post === "function" &&
                    typeof m.put === "function"
                );
            },
            {
                searchExports: true,
                defaultExport: false
            }
        ) || [];

        for (const mod of modules) {
            let patched = seen.get(mod);

            if (!patched) {
                patched = new Set();
                seen.set(mod, patched);
            }

            for (const method of methods) {
                if (
                    typeof mod[method] !== "function" ||
                    patched.has(method)
                ) {
                    continue;
                }

                try {
                    const unpatch = BdApi.Patcher.instead(
                        this.id,
                        mod,
                        method,
                        (context, args, original) => {
                            const request = args[0];

                            const url =
                                typeof request === "string"
                                    ? request
                                    : request?.url;

                            if (
                                url &&
                                this.isReadRequest(
                                    url,
                                    method
                                )
                            ) {
                                this.recordBlock(
                                    "HTTP." + method
                                );

                                return Promise.resolve({
                                    ok: true,
                                    status: 204,
                                    body: {},
                                    headers: {}
                                });
                            }

                            return original.apply(
                                context,
                                args
                            );
                        }
                    );

                    if (typeof unpatch === "function") {
                        patched.add(method);
                        this.hooks++;
                    }
                } catch (error) {
                    console.warn(
                        "[GhostRead] HTTP hook failed:",
                        method,
                        error
                    );
                }
            }
        }
    }

    installFetchHook() {
        if (typeof window.fetch !== "function") {
            return;
        }

        const original = window.fetch;
        this.originalFetch = original;

        const plugin = this;

        const wrapper = function(input, init) {
            const url =
                typeof input === "string"
                    ? input
                    : input?.url;

            const method =
                init?.method ||
                input?.method ||
                "GET";

            if (
                url &&
                plugin.isReadRequest(url, method)
            ) {
                plugin.recordBlock("fetch");

                return Promise.resolve(
                    new Response(null, {
                        status: 204
                    })
                );
            }

            return original.apply(this, arguments);
        };

        this.fetchWrapper = wrapper;
        window.fetch = wrapper;
        this.hooks++;
    }

    activate() {
        if (this.active) return;

        this.deactivate();
        this.blocked = 0;

        try {
            this.active = true;

            this.installHttpHooks();
            this.installFetchHook();

            if (this.hooks === 0) {
                this.deactivate();

                BdApi.UI.showToast(
                    "GhostRead: no hooks available",
                    {type: "error"}
                );

                return;
            }

            BdApi.UI.showToast(
                "GhostRead ON - experimental",
                {type: "success"}
            );

            console.log(
                "[GhostRead] Active hooks:",
                this.hooks
            );
        } catch (error) {
            console.error(
                "[GhostRead] Activation failed:",
                error
            );

            this.deactivate();
        }
    }

    deactivate() {
        this.active = false;

        BdApi.Patcher.unpatchAll(this.id);

        if (
            this.fetchWrapper &&
            window.fetch === this.fetchWrapper
        ) {
            window.fetch = this.originalFetch;
        }

        this.fetchWrapper = null;
        this.originalFetch = null;
        this.hooks = 0;
    }

    getSettingsPanel() {
        const panel = document.createElement("div");
        panel.style.padding = "16px";

        const title = document.createElement("h3");
        title.textContent = "GhostRead v0.6.0";
        panel.appendChild(title);

        const description = document.createElement("p");
        description.textContent =
            "Experimental server and DM read protection. " +
            "Does not guarantee unread preservation.";
        panel.appendChild(description);

        const status = document.createElement("p");
        const counter = document.createElement("p");

        panel.appendChild(status);
        panel.appendChild(counter);

        const button = document.createElement("button");
        button.style.padding = "10px 16px";
        button.style.cursor = "pointer";

        const refreshButton =
            document.createElement("button");

        refreshButton.textContent = "Refresh Statistics";
        refreshButton.style.padding = "10px 16px";
        refreshButton.style.marginLeft = "8px";
        refreshButton.style.cursor = "pointer";

        const refresh = () => {
            status.textContent = this.active
                ? `Status: ON (${this.hooks} hooks)`
                : "Status: OFF";

            counter.textContent =
                `Read requests blocked: ${this.blocked}`;

            button.textContent = this.active
                ? "Deactivate GhostRead"
                : "Activate GhostRead";
        };

        button.onclick = () => {
            if (this.active) {
                this.deactivate();
            } else {
                this.activate();
            }

            refresh();
        };

        refreshButton.onclick = refresh;

        panel.appendChild(button);
        panel.appendChild(refreshButton);

        refresh();

        return panel;
    }
};