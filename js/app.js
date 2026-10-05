const SIGPE = {
    map: null,

    data: {
        ageb: null,
        alcaldias: null,
        escuelas: [],
        conapo: [],
        analisis: []
    },

    layers: {
        ageb: null,
        alcaldias: null
    },

    years: Array.from(
        { length: 12 },
        (_, index) => {
            const year = 2024 + index;

            return {
                year,
                label: `${year}-${year + 1}`,
                field: `mat_${year}_${year + 1}`
            };
        }
    ),

    // La vista inicial muestra una proyección real, no el ciclo base.
    currentYearIndex: 11,
    currentLevel: "Todos",
    currentAlcaldia: "Todos",
    currentVariable: "percentage",
    currentTerritory: "ageb",
    currentPercentageRange: "all",

    selectedSchool: null,
    selectedTerritoryFeature: null,
    selectedTerritoryType: null,
    comparison: [],
    initialBoundsApplied: false
};


window.addEventListener(
    "DOMContentLoaded",
    async () => {
        try {
            initializeMap();

            await loadData();

            populateYearSelector();
            enrichAlcaldias();

            drawAlcaldias();
            drawAGEB();

            initializeFilters();
            initializeSearch();
            initializeSidebar();
            initializeComparison();
            initializeLayerControls();
            initializeCollapsibleSections();
            initializeMainViews();
            initializeMobileFilters();
            initializeFullscreen();

            refreshMap();

            // Leaflet necesita recalcular el tamaño después de que el grid
            // y los paneles hayan terminado de ocupar su espacio definitivo.
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    SIGPE.map?.invalidateSize(true);
                });
            });

            window.addEventListener("resize", debounce(() => {
                SIGPE.map?.invalidateSize(false);
            }, 120));

            console.log(
                "SIGPE-CDMX v3.0 cargado correctamente",
                {
                    ageb:
                        SIGPE.data.ageb.features.length,

                    alcaldias:
                        SIGPE.data.alcaldias.features.length,

                    escuelas:
                        SIGPE.data.escuelas.length
                }
            );
        } catch (error) {
            console.error(
                "No se pudo iniciar SIGPE-CDMX:",
                error
            );

            alert(
                "No se pudieron cargar los datos. " +
                "Abre la consola con F12 para ver " +
                "qué archivo está fallando."
            );
        }
    }
);

function initializeCollapsibleSections() {
    document.querySelectorAll(".collapsible-section").forEach(section => {
        const button = section.querySelector(".section-toggle");
        if (!button) return;
        button.addEventListener("click", () => {
            const collapsed = section.classList.toggle("is-collapsed");
            button.setAttribute("aria-expanded", String(!collapsed));
        });
    });
}

function initializeMainViews() {
    document.querySelectorAll("[data-main-view]").forEach(button => {
        button.addEventListener("click", () => setMainView(button.dataset.mainView));
    });
    byId("summaryBackToMap")?.addEventListener("click", () => setMainView("map"));
}

function setMainView(view) {
    const summary = view === "summary";
    byId("summaryView")?.classList.toggle("is-hidden", !summary);
    document.querySelectorAll("[data-main-view]").forEach(button => {
        const active = button.dataset.mainView === (summary ? "summary" : "map");
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
    });
    if (summary) {
        renderAlcaldiaSummary();
        closeMobileFilters();
    } else {
        setTimeout(() => SIGPE.map?.invalidateSize(false), 50);
    }
}

function initializeMobileFilters() {
    byId("filtersToggleBtn")?.addEventListener("click", openMobileFilters);
    byId("mobileFiltersClose")?.addEventListener("click", closeMobileFilters);
    byId("mobileBackdrop")?.addEventListener("click", closeMobileFilters);
}

function openMobileFilters() {
    byId("filtersPanel")?.classList.add("open");
    byId("mobileBackdrop")?.classList.add("visible");
    byId("filtersToggleBtn")?.setAttribute("aria-expanded", "true");
}

function closeMobileFilters() {
    byId("filtersPanel")?.classList.remove("open");
    byId("mobileBackdrop")?.classList.remove("visible");
    byId("filtersToggleBtn")?.setAttribute("aria-expanded", "false");
}
