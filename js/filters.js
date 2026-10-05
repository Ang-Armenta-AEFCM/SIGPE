/* =========================================================
   FILTROS Y ESTADÍSTICAS
   ========================================================= */

function initializeFilters() {
    populateLevelFilter();
    populateAlcaldiaFilter();
    connectYearFilter();
    connectTerritoryFilter();
    connectVariableFilter();
    connectPercentageRangeFilter();
    connectLevelFilter();
    connectAlcaldiaFilter();
    connectClearFiltersButton();
}


/* =========================================================
   FILTRO DE CICLO
   ========================================================= */

function connectYearFilter() {
    const selector = firstExistingElement(
        "yearSelect",
        "yearFilter",
        "filtroAnio"
    );

    const slider = firstExistingElement(
        "yearSlider",
        "yearRange"
    );

    if (selector) {
        selector.value = String(SIGPE.currentYearIndex);

        selector.addEventListener("change", event => {
            SIGPE.currentYearIndex = Number(event.target.value) || 0;

            if (slider) {
                slider.value = String(SIGPE.currentYearIndex);
            }

            refreshMap();
            refreshOpenDetails();
        });
    }

    if (slider) {
        slider.min = "0";
        slider.max = String(SIGPE.years.length - 1);
        slider.value = String(SIGPE.currentYearIndex);

        slider.addEventListener("input", event => {
            SIGPE.currentYearIndex = Number(event.target.value) || 0;

            if (selector) {
                selector.value = String(SIGPE.currentYearIndex);
            }

            refreshMap();
            refreshOpenDetails();
        });
    }
}


/* =========================================================
   UNIDAD TERRITORIAL
   ========================================================= */

function connectTerritoryFilter() {
    const selector = byId("territorySelect");
    if (!selector) return;

    selector.value = SIGPE.currentTerritory;
    selector.addEventListener("change", event => {
        SIGPE.currentTerritory = event.target.value === "alcaldia"
            ? "alcaldia"
            : "ageb";

        closeSchoolDetails();
        updateTerritoryUI();
        refreshMap();
    });

    updateTerritoryUI();
}


/* =========================================================
   VARIABLE DEL MAPA
   ========================================================= */

function connectVariableFilter() {
    const selector = byId("variableSelect");
    if (!selector) return;

    selector.value = SIGPE.currentVariable;
    updateVariableButtons();

    document.querySelectorAll("[data-variable]").forEach(button => {
        button.addEventListener("click", () => {
            selector.value = button.dataset.variable;
            selector.dispatchEvent(new Event("change", { bubbles: true }));
        });
    });

    selector.addEventListener("change", event => {
        SIGPE.currentVariable = event.target.value === "percentage"
            ? "percentage"
            : "total";
        if (SIGPE.currentVariable !== "percentage") {
            SIGPE.currentPercentageRange = "all";
            const range = byId("percentageRangeFilter");
            if (range) range.value = "all";
        }
        updateVariableButtons();
        updateTerritoryUI();
        refreshMap();
    });
}

function updateVariableButtons() {
    document.querySelectorAll("[data-variable]").forEach(button => {
        const active = button.dataset.variable === SIGPE.currentVariable;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
    });
}

function connectPercentageRangeFilter() {
    const selector = byId("percentageRangeFilter");
    if (!selector) return;
    selector.value = SIGPE.currentPercentageRange;
    selector.addEventListener("change", event => {
        SIGPE.currentPercentageRange = event.target.value || "all";
        closeSchoolDetails();
        refreshMap();
    });
}

function updateTerritoryUI() {
    const isAlcaldia = SIGPE.currentTerritory === "alcaldia";
    byId("agebLayerOption")?.classList.toggle("is-hidden", isAlcaldia);
    byId("schoolsLayerOption")?.classList.toggle("is-hidden", isAlcaldia);
    byId("alcaldiaLayerOption")?.classList.toggle("is-hidden", false);
    byId("percentageRangeGroup")?.classList.toggle("is-hidden", SIGPE.currentVariable !== "percentage");
    updateMiniVariableLegend();

    const unitsLabel = byId("unitsStatLabel");
    if (unitsLabel) unitsLabel.textContent = isAlcaldia ? "Alcaldías mostradas" : "AGEB con matrícula";

    const status = byId("mapStatusText");
    if (status) status.innerHTML = isAlcaldia
        ? '<i class="fa-solid fa-circle-info" aria-hidden="true"></i> Selecciona una alcaldía para consultar su evolución y contexto.'
        : '<i class="fa-solid fa-circle-info" aria-hidden="true"></i> Selecciona una zona (AGEB) para consultar sus planteles.';
}


function updateMiniVariableLegend() {
    const container = byId("miniVariableLegend");
    if (!container) return;

    if (SIGPE.currentVariable === "percentage") {
        container.innerHTML = `
            <div class="mini-legend-heading">Escala de variación porcentual</div>
            <div class="mini-color-bar mini-color-bar-percentage" aria-hidden="true"></div>
            <div class="mini-color-labels"><span>Disminución</span><span>Estable</span><span>Crecimiento</span></div>
        `;
    } else {
        container.innerHTML = `
            <div class="mini-legend-heading">Escala de matrícula</div>
            <div class="mini-color-bar mini-color-bar-total" aria-hidden="true"></div>
            <div class="mini-color-labels"><span>Menor</span><span>Mayor</span></div>
        `;
    }
}


/* =========================================================
   FILTRO DE NIVEL
   ========================================================= */

function populateLevelFilter() {
    const selector = firstExistingElement(
        "levelFilter",
        "nivelFilter",
        "filterLevel",
        "filtroNivel"
    );

    if (!selector) {
        console.warn(
            "No se encontró el selector de nivel. " +
            "Debe tener id levelFilter o nivelFilter."
        );

        return;
    }

    const preferredOrder = [
        "Inicial",
        "Especial",
        "Preescolar",
        "Primaria",
        "Secundaria",
        "Adultos"
    ];

    const availableLevels = [
        ...new Set(
            SIGPE.data.escuelas
                .map(school => String(school.nivel || "").trim())
                .filter(Boolean)
        )
    ];

    const orderedLevels = preferredOrder.filter(preferred =>
        availableLevels.some(
            available =>
                normalizeString(available) ===
                normalizeString(preferred)
        )
    );

    availableLevels.forEach(level => {
        const alreadyIncluded = orderedLevels.some(
            included =>
                normalizeString(included) ===
                normalizeString(level)
        );

        if (!alreadyIncluded) {
            orderedLevels.push(level);
        }
    });

    selector.innerHTML = `
        <option value="Todos">Todos los niveles</option>
        ${orderedLevels
            .map(level => `
                <option value="${escapeHTML(level)}">
                    ${escapeHTML(level)}
                </option>
            `)
            .join("")}
    `;

    selector.value = SIGPE.currentLevel;
}


function connectLevelFilter() {
    const selector = firstExistingElement(
        "levelFilter",
        "nivelFilter",
        "filterLevel",
        "filtroNivel"
    );

    if (!selector) return;

    selector.addEventListener("change", event => {
        SIGPE.currentLevel = event.target.value || "Todos";

        closeSchoolDetails();
        refreshMap();
    });
}


/* =========================================================
   FILTRO DE ALCALDÍA
   ========================================================= */

function populateAlcaldiaFilter() {
    const selector = firstExistingElement(
        "alcaldiaFilter",
        "boroughFilter",
        "filterAlcaldia",
        "filtroAlcaldia"
    );

    if (!selector) {
        console.warn(
            "No se encontró el selector de alcaldía. " +
            "Debe tener id alcaldiaFilter."
        );

        return;
    }

    const municipalities = new Map();

    SIGPE.data.escuelas.forEach(school => {
        if (!school.alcaldia) return;

        const municipalCode = String(school.mun || "")
            .padStart(3, "0");

        municipalities.set(
            normalizeString(school.alcaldia),
            {
                name: school.alcaldia,
                code: municipalCode
            }
        );
    });

    const sortedMunicipalities = [...municipalities.values()]
        .sort((a, b) =>
            a.name.localeCompare(b.name, "es")
        );

    selector.innerHTML = `
        <option value="Todos">Todas las alcaldías</option>
        ${sortedMunicipalities
            .map(item => `
                <option value="${escapeHTML(item.code)}">
                    ${escapeHTML(item.name)}
                </option>
            `)
            .join("")}
    `;

    selector.value = SIGPE.currentAlcaldia;
}


function connectAlcaldiaFilter() {
    const selector = firstExistingElement(
        "alcaldiaFilter",
        "boroughFilter",
        "filterAlcaldia",
        "filtroAlcaldia"
    );

    if (!selector) return;

    selector.addEventListener("change", event => {
        SIGPE.currentAlcaldia =
            event.target.value || "Todos";

        closeSchoolDetails();
        refreshMap();
        zoomToSelectedAlcaldia();
    });
}


/* =========================================================
   LIMPIAR FILTROS
   ========================================================= */

function connectClearFiltersButton() {
    const button = firstExistingElement(
        "clearFilters",
        "clearFiltersBtn",
        "limpiarFiltros"
    );

    if (!button) return;

    button.addEventListener("click", () => {
        SIGPE.currentYearIndex = SIGPE.years.length - 1;
        SIGPE.currentLevel = "Todos";
        SIGPE.currentAlcaldia = "Todos";
        SIGPE.currentVariable = "percentage";
        SIGPE.currentTerritory = "ageb";
        SIGPE.currentPercentageRange = "all";

        const yearSelector = firstExistingElement(
            "yearSelect",
            "yearFilter",
            "filtroAnio"
        );

        const yearSlider = firstExistingElement(
            "yearSlider",
            "yearRange"
        );

        const levelSelector = firstExistingElement(
            "levelFilter",
            "nivelFilter",
            "filterLevel",
            "filtroNivel"
        );

        const alcaldiaSelector = firstExistingElement(
            "alcaldiaFilter",
            "boroughFilter",
            "filterAlcaldia",
            "filtroAlcaldia"
        );

        if (yearSelector) yearSelector.value = String(SIGPE.years.length - 1);
        if (yearSlider) yearSlider.value = String(SIGPE.years.length - 1);
        if (levelSelector) levelSelector.value = "Todos";
        if (alcaldiaSelector) alcaldiaSelector.value = "Todos";

        const territorySelector = byId("territorySelect");
        const variableSelector = byId("variableSelect");
        if (territorySelector) territorySelector.value = "ageb";
        if (variableSelector) variableSelector.value = "percentage";
        const percentageRangeSelector = byId("percentageRangeFilter");
        if (percentageRangeSelector) percentageRangeSelector.value = "all";
        updateVariableButtons();
        updateTerritoryUI();

        const searchInput = byId("searchInput");

        if (searchInput) {
            searchInput.value = "";
        }

        hideSearchResults();
        closeSchoolDetails();
        refreshMap();

        const bounds = L.geoJSON(SIGPE.data.ageb).getBounds();

        if (bounds.isValid()) {
            SIGPE.map.fitBounds(bounds, {
                padding: [20, 20]
            });
        }
    });
}


/* =========================================================
   ZOOM A ALCALDÍA
   ========================================================= */

function zoomToSelectedAlcaldia() {
    if (SIGPE.currentAlcaldia === "Todos") {
        return;
    }

    const matchingFeature =
        SIGPE.data.alcaldias.features.find(feature => {
            const code = String(
                feature.properties.CVE_MUN || ""
            ).padStart(3, "0");

            return code === SIGPE.currentAlcaldia;
        });

    if (!matchingFeature) return;

    const bounds = L.geoJSON(matchingFeature).getBounds();

    if (bounds.isValid()) {
        SIGPE.map.fitBounds(bounds, {
            padding: [25, 25],
            maxZoom: 13
        });
    }
}


/* =========================================================
   ESTADÍSTICAS DINÁMICAS
   ========================================================= */

function updateDashboard() {
    if (!SIGPE.data.ageb) return;

    const features = SIGPE.currentTerritory === "alcaldia"
        ? getFilteredAlcaldias()
        : getFilteredAGEB();
    const currentField = getCurrentYearField();

    const filteredSchools = SIGPE.data.escuelas.filter(school => {
        const matchesLevel =
            SIGPE.currentLevel === "Todos" ||
            normalizeString(school.nivel) ===
                normalizeString(SIGPE.currentLevel);

        const matchesAlcaldia =
            SIGPE.currentAlcaldia === "Todos" ||
            String(school.mun || "").padStart(3, "0") ===
                SIGPE.currentAlcaldia;

        const current = Number(school[currentField]) || 0;
        const base = Number(school.mat_2024_2025) || 0;
        const change = percent(current, base);
        const matchesVariation = SIGPE.currentVariable !== "percentage" ||
            matchesPercentageRange(change);

        return matchesLevel && matchesAlcaldia && matchesVariation;
    });

    const currentEnrollment = filteredSchools.reduce(
        (sum, school) =>
            sum + (Number(school[currentField]) || 0),
        0
    );

    const baseEnrollment = filteredSchools.reduce(
        (sum, school) =>
            sum + (Number(school.mat_2024_2025) || 0),
        0
    );

    const totalSchools = filteredSchools.length;

    const totalUnits = SIGPE.currentTerritory === "alcaldia"
        ? getFilteredAlcaldias().length
        : getFilteredAGEB().filter(feature => getFeatureValue(feature) > 0).length;

    const accumulatedChange = percent(
        currentEnrollment,
        baseEnrollment
    );
    const absoluteChange = currentEnrollment - baseEnrollment;

    setDashboardValue(
        ["totalEscuelas", "statSchools"],
        formatNumber(totalSchools)
    );

    setDashboardValue(
        ["totalMatricula", "statEnrollment"],
        formatNumber(currentEnrollment)
    );

    setDashboardValue(
        ["baseMatricula"],
        formatNumber(baseEnrollment)
    );

    setDashboardValue(
        ["totalAGEB", "unitsCount", "statAGEB"],
        formatNumber(totalUnits)
    );

    setDashboardValue(
        ["cambioTotal", "statChange"],
        formatPercentage(accumulatedChange)
    );

    setDashboardValue(
        ["cambioAbsoluto"],
        `${absoluteChange > 0 ? "+" : ""}${formatNumber(absoluteChange)} estudiantes`
    );

    const changeCard = byId("cambioTotal")?.closest(".map-kpi");
    changeCard?.classList.toggle("negative", absoluteChange < 0);
    changeCard?.classList.toggle("positive", absoluteChange > 0);

    const currentCycle = firstExistingElement(
        "currentCycle",
        "selectedYearLabel"
    );

    if (currentCycle) {
        currentCycle.textContent = getCurrentYear().label;
    }

    updateViewStatement();
    renderAlcaldiaSummary();
    updateMapLegend(features);
}

function updateViewStatement() {
    const statement = byId("viewStatement");
    if (!statement) return;
    const level = SIGPE.currentLevel === "Todos" ? "Todos los niveles" : SIGPE.currentLevel;
    const alcaldiaSelect = byId("alcaldiaFilter");
    const alcaldia = SIGPE.currentAlcaldia === "Todos"
        ? "Toda la CDMX"
        : alcaldiaSelect?.selectedOptions?.[0]?.textContent?.trim() || "Alcaldía seleccionada";
    const metric = SIGPE.currentVariable === "percentage"
        ? `cambio proyectado para ${getCurrentYear().label} comparado con 2024-2025`
        : `matrícula proyectada para ${getCurrentYear().label}`;
    statement.innerHTML = `<strong>Estás viendo:</strong> ${escapeHTML(level)} · ${escapeHTML(alcaldia)} · ${escapeHTML(metric)}.`;
}

function getSchoolsForCurrentSummary() {
    const currentField = getCurrentYearField();
    return SIGPE.data.escuelas.filter(school => {
        const levelMatch = SIGPE.currentLevel === "Todos" ||
            normalizeString(school.nivel) === normalizeString(SIGPE.currentLevel);
        const municipalityMatch = SIGPE.currentAlcaldia === "Todos" ||
            String(school.mun || "").padStart(3, "0") === SIGPE.currentAlcaldia;
        const change = percent(Number(school[currentField]) || 0, Number(school.mat_2024_2025) || 0);
        const rangeMatch = SIGPE.currentVariable !== "percentage" || matchesPercentageRange(change);
        return levelMatch && municipalityMatch && rangeMatch;
    });
}

function renderAlcaldiaSummary() {
    const body = byId("summaryTableBody");
    if (!body || !SIGPE.data.escuelas.length) return;
    const currentField = getCurrentYearField();
    const groups = new Map();
    getSchoolsForCurrentSummary().forEach(school => {
        const key = String(school.mun || "").padStart(3, "0");
        if (!groups.has(key)) groups.set(key, { name: school.alcaldia, base: 0, projected: 0, schools: 0 });
        const group = groups.get(key);
        group.base += Number(school.mat_2024_2025) || 0;
        group.projected += Number(school[currentField]) || 0;
        group.schools += 1;
    });
    const rows = [...groups.values()].map(group => ({
        ...group,
        difference: group.projected - group.base,
        change: percent(group.projected, group.base)
    })).sort((a, b) => (a.change ?? Infinity) - (b.change ?? Infinity));

    const signed = value => `${value > 0 ? "+" : ""}${formatNumber(value)}`;
    body.innerHTML = rows.length ? rows.map(row => `
        <tr>
            <th scope="row">${escapeHTML(row.name)}</th>
            <td>${formatNumber(row.base)}</td>
            <td>${formatNumber(row.projected)}</td>
            <td class="${row.difference < 0 ? "negative-value" : row.difference > 0 ? "positive-value" : ""}">${signed(row.difference)}</td>
            <td><span class="change-badge ${row.change < -2 ? "decrease" : row.change > 2 ? "increase" : "stable"}">${formatPercentage(row.change)}</span></td>
        </tr>`).join("") : '<tr><td colspan="5" class="empty-message">No hay resultados para los filtros seleccionados.</td></tr>';

    const ranking = (items, target) => {
        const host = byId(target);
        if (!host) return;
        host.innerHTML = items.length ? items.map((row, index) => `
            <div class="ranking-row"><span class="ranking-position">${index + 1}</span><strong>${escapeHTML(row.name)}</strong><span>${formatPercentage(row.change)}</span></div>
        `).join("") : '<p class="empty-message">Sin alcaldías en esta categoría.</p>';
    };
    ranking(rows.filter(row => row.change < -2).slice(0, 5), "topDecreases");
    ranking([...rows].filter(row => row.change > 2).sort((a, b) => b.change - a.change).slice(0, 5), "topIncreases");

    const level = SIGPE.currentLevel === "Todos" ? "Todos los niveles" : SIGPE.currentLevel;
    byId("summaryScope").textContent = `${level} · ${getCurrentYear().label} frente a 2024-2025 · ${formatNumber(rows.reduce((sum, row) => sum + row.schools, 0))} planteles.`;
    byId("summaryProjectedHeader").textContent = `Proyección ${getCurrentYear().label}`;
}


function setDashboardValue(ids, value) {
    ids.forEach(id => {
        const element = byId(id);

        if (element) {
            element.textContent = value;
        }
    });
}


/* =========================================================
   LEYENDA
   ========================================================= */

function updateMapLegend(features) {
    const legend = byId("legend");
    if (!legend) return;

    if (SIGPE.currentVariable === "percentage") {
        const items = [
            ["Sin base", "#d1d5db"],
            ["Menor a -10%", "#7f0000"],
            ["-10% a -7%", "#b2182b"],
            ["-7% a -4%", "#d6604d"],
            ["-4% a -2%", "#f4a582"],
            ["-2% a +2%", "#f7f7f7"],
            ["+2% a +5%", "#d9f0d3"],
            ["+5% a +10%", "#7fbf7b"],
            ["+10% a +20%", "#1b7837"],
            ["Mayor a +20%", "#00441b"]
        ];

        legend.innerHTML = items.map(([label, color]) => `
            <div class="legend-item">
                <span class="legend-color" style="background:${color}"></span>
                <span>${label}</span>
            </div>
        `).join("");
        return;
    }

    const values = features
        .map(feature => getFeatureValue(feature))
        .filter(value => value > 0);

    const breaks = calculateQuantiles(values);
    const items = [
        { label: "Sin matrícula", color: "#e5e7eb" },
        { label: `1 – ${formatNumber(Math.round(breaks[0]))}`, color: getTotalColor(1, breaks) },
        { label: `${formatNumber(Math.round(breaks[0] + 1))} – ${formatNumber(Math.round(breaks[1]))}`, color: getTotalColor(breaks[0] + 1, breaks) },
        { label: `${formatNumber(Math.round(breaks[1] + 1))} – ${formatNumber(Math.round(breaks[2]))}`, color: getTotalColor(breaks[1] + 1, breaks) },
        { label: `${formatNumber(Math.round(breaks[2] + 1))} – ${formatNumber(Math.round(breaks[3]))}`, color: getTotalColor(breaks[2] + 1, breaks) },
        { label: `Más de ${formatNumber(Math.round(breaks[3]))}`, color: getTotalColor(breaks[3] + 1, breaks) }
    ];

    legend.innerHTML = items.map(item => `
        <div class="legend-item">
            <span class="legend-color" style="background:${item.color}"></span>
            <span>${item.label}</span>
        </div>
    `).join("");
}
