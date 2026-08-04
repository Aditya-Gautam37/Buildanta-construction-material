import { h as require_react, n as require_jsx_runtime, y as __toESM } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/calculator-wizard-D48ZdnUF.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var calculator_module_default = {
	page: "_page_r94zu_1",
	hero: "_hero_r94zu_2",
	eyebrow: "_eyebrow_r94zu_4",
	trust: "_trust_r94zu_7",
	content: "_content_r94zu_9",
	intro: "_intro_r94zu_10",
	featuredPlanner: "_featuredPlanner_r94zu_13",
	plannerChips: "_plannerChips_r94zu_16",
	plannerAction: "_plannerAction_r94zu_18",
	calculatorGroup: "_calculatorGroup_r94zu_20",
	grid: "_grid_r94zu_22",
	card: "_card_r94zu_23",
	icon: "_icon_r94zu_25",
	empty: "_empty_r94zu_29",
	calculatorHero: "_calculatorHero_r94zu_30",
	workspace: "_workspace_r94zu_34",
	workspaceWithBoq: "_workspaceWithBoq_r94zu_35",
	steps: "_steps_r94zu_36",
	step: "_step_r94zu_36",
	stepActive: "_stepActive_r94zu_40",
	layout: "_layout_r94zu_41",
	layoutWithBoq: "_layoutWithBoq_r94zu_42",
	panel: "_panel_r94zu_43",
	boqPanel: "_boqPanel_r94zu_44",
	muted: "_muted_r94zu_45",
	scopeNote: "_scopeNote_r94zu_46",
	formGrid: "_formGrid_r94zu_48",
	formSectionTitle: "_formSectionTitle_r94zu_49",
	field: "_field_r94zu_51",
	fieldWide: "_fieldWide_r94zu_54",
	check: "_check_r94zu_55",
	primary: "_primary_r94zu_56",
	error: "_error_r94zu_58",
	resultHeader: "_resultHeader_r94zu_59",
	total: "_total_r94zu_59",
	boqKicker: "_boqKicker_r94zu_60",
	projectSummary: "_projectSummary_r94zu_61",
	boqToolbar: "_boqToolbar_r94zu_64",
	toolbarPrimary: "_toolbarPrimary_r94zu_64",
	boqTable: "_boqTable_r94zu_65",
	boqHead: "_boqHead_r94zu_66",
	boqRow: "_boqRow_r94zu_66",
	items: "_items_r94zu_68",
	resultGroup: "_resultGroup_r94zu_69",
	groupHeading: "_groupHeading_r94zu_69",
	rowNumber: "_rowNumber_r94zu_70",
	materialCell: "_materialCell_r94zu_70",
	quantityCell: "_quantityCell_r94zu_70",
	purchaseCell: "_purchaseCell_r94zu_70",
	rateCell: "_rateCell_r94zu_70",
	amountCell: "_amountCell_r94zu_70",
	boqTotals: "_boqTotals_r94zu_71",
	grandTotal: "_grandTotal_r94zu_71",
	assumptionDetails: "_assumptionDetails_r94zu_72",
	assumptions: "_assumptions_r94zu_72",
	item: "_item_r94zu_68",
	itemImage: "_itemImage_r94zu_74",
	availability: "_availability_r94zu_75",
	quote: "_quote_r94zu_77",
	success: "_success_r94zu_77",
	disclaimer: "_disclaimer_r94zu_78",
	inputPanel: "_inputPanel_r94zu_82",
	panelHeader: "_panelHeader_r94zu_86",
	panelIcon: "_panelIcon_r94zu_88",
	panelEyebrow: "_panelEyebrow_r94zu_89",
	calculateButton: "_calculateButton_r94zu_90",
	resultPanel: "_resultPanel_r94zu_92",
	readyBadge: "_readyBadge_r94zu_94",
	documentBar: "_documentBar_r94zu_96",
	costHero: "_costHero_r94zu_99",
	costMetrics: "_costMetrics_r94zu_99",
	costOverview: "_costOverview_r94zu_101",
	boqFilters: "_boqFilters_r94zu_121",
	scopeCoverageNotice: "_scopeCoverageNotice_r94zu_122",
	materialSearch: "_materialSearch_r94zu_128",
	stageTabs: "_stageTabs_r94zu_132",
	stageTabActive: "_stageTabActive_r94zu_137",
	filterStatus: "_filterStatus_r94zu_139",
	stageNumber: "_stageNumber_r94zu_144",
	cellLabel: "_cellLabel_r94zu_150",
	quoteIntro: "_quoteIntro_r94zu_155",
	quoteIcon: "_quoteIcon_r94zu_156",
	noResults: "_noResults_r94zu_159",
	boqEmpty: "_boqEmpty_r94zu_160",
	emptyDocument: "_emptyDocument_r94zu_161",
	emptyFlow: "_emptyFlow_r94zu_164",
	resultLoading: "_resultLoading_r94zu_165",
	loadingOverlay: "_loadingOverlay_r94zu_165",
	loadingMark: "_loadingMark_r94zu_168",
	boqSpin: "_boqSpin_r94zu_1"
};
var import_jsx_runtime = require_jsx_runtime();
function numeric(data, key) {
	return Number(data.get(key));
}
function optionalNumeric(data, key, fallback = 0) {
	const value = String(data.get(key) ?? "");
	return value ? Number(value) : fallback;
}
function buildInputs(type, data) {
	if (type === "BUILDING_BUDGET") return {
		projectName: String(data.get("projectName")),
		siteLocation: String(data.get("siteLocation")),
		plotAreaSqFt: numeric(data, "plotAreaSqFt"),
		builtUpAreaSqFt: numeric(data, "builtUpAreaSqFt"),
		floors: numeric(data, "floors"),
		rooms: numeric(data, "rooms"),
		bathrooms: numeric(data, "bathrooms"),
		kitchens: numeric(data, "kitchens"),
		projectType: String(data.get("projectType")),
		structureSystem: String(data.get("structureSystem")),
		floorHeightFt: numeric(data, "floorHeightFt"),
		tileCoveragePercent: numeric(data, "tileCoveragePercent"),
		includeCeilingPaint: data.get("includeCeilingPaint") === "on",
		constructionScope: String(data.get("constructionScope")),
		wastagePercent: numeric(data, "wastagePercent")
	};
	const common = {
		quantity: numeric(data, "quantity"),
		wastagePercent: numeric(data, "wastagePercent")
	};
	if (type === "CEMENT_CONCRETE") return {
		...common,
		componentType: String(data.get("componentType")),
		lengthM: numeric(data, "lengthM"),
		widthM: numeric(data, "widthM"),
		thicknessM: numeric(data, "thicknessM")
	};
	if (type === "BRICKS_BLOCKS") return {
		...common,
		material: String(data.get("material")),
		wallLengthM: numeric(data, "wallLengthM"),
		wallHeightM: numeric(data, "wallHeightM"),
		wallThicknessM: numeric(data, "wallThicknessM"),
		openingsAreaM2: optionalNumeric(data, "openingsAreaM2")
	};
	if (type === "TILES_FLOORING") return {
		...common,
		surfaceType: String(data.get("surfaceType")),
		lengthM: numeric(data, "lengthM"),
		widthM: numeric(data, "widthM"),
		openingsAreaM2: optionalNumeric(data, "openingsAreaM2"),
		tileLengthM: numeric(data, "tileLengthM"),
		tileWidthM: numeric(data, "tileWidthM")
	};
	return {
		...common,
		roomLengthM: numeric(data, "roomLengthM"),
		roomWidthM: numeric(data, "roomWidthM"),
		wallHeightM: numeric(data, "wallHeightM"),
		openingsAreaM2: optionalNumeric(data, "openingsAreaM2"),
		includeCeiling: data.get("includeCeiling") === "on",
		paintCoats: numeric(data, "paintCoats"),
		primerCoats: numeric(data, "primerCoats"),
		puttyCoats: numeric(data, "puttyCoats")
	};
}
function scopeLabel(scope) {
	if (scope === "FOUNDATION") return "Foundation only";
	if (scope === "STRUCTURE") return "Foundation and structural shell";
	if (scope === "FULL_FINISH") return "Full finished planning";
	return "Project material plan";
}
function labelValue(value) {
	return String(value || "-").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function money(value) {
	return value == null ? "Request price" : `INR ${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
function csvCell(value) {
	return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
}
function CalculatorWizard({ calculator }) {
	const [estimate, setEstimate] = (0, import_react.useState)(null);
	const [calculating, setCalculating] = (0, import_react.useState)(false);
	const [quoting, setQuoting] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [quotationReference, setQuotationReference] = (0, import_react.useState)("");
	const [stageFilter, setStageFilter] = (0, import_react.useState)("ALL");
	const [materialSearch, setMaterialSearch] = (0, import_react.useState)("");
	const submissionReference = (0, import_react.useRef)(`calc-${crypto.randomUUID()}`);
	const isBuildingPlan = calculator.type === "BUILDING_BUDGET";
	const groupedItems = estimate ? Array.from(estimate.items.reduce((groups, item) => {
		const group = item.group || "Material requirement";
		groups.set(group, [...groups.get(group) || [], item]);
		return groups;
	}, /* @__PURE__ */ new Map())) : [];
	const normalizedSearch = materialSearch.trim().toLowerCase();
	const visibleGroups = groupedItems.filter(([group]) => stageFilter === "ALL" || group === stageFilter).map(([group, items]) => [group, items.filter((item) => {
		if (!normalizedSearch) return true;
		return [
			item.description,
			item.product?.name,
			item.product?.brand,
			item.variant?.sku
		].some((value) => value?.toLowerCase().includes(normalizedSearch));
	})]).filter(([, items]) => items.length > 0);
	const visibleLineCount = visibleGroups.reduce((total, [, items]) => total + items.length, 0);
	const pricedLineCount = estimate?.items.filter((item) => item.lineTotal != null).length || 0;
	async function calculate(event) {
		event.preventDefault();
		setCalculating(true);
		setError("");
		setQuotationReference("");
		const data = new FormData(event.currentTarget);
		try {
			const response = await fetch(`/api/calculators/${encodeURIComponent(calculator.slug)}/calculate`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					deliveryPincode: String(data.get("deliveryPincode")),
					qualityTier: String(data.get("qualityTier")),
					sessionReference: submissionReference.current,
					inputs: buildInputs(calculator.type, data)
				})
			});
			const body = await response.json();
			if (!response.ok) throw new Error(body.issues?.map((item) => item.message).join(" ") || body.message || "The estimate could not be calculated.");
			setEstimate(body);
			setStageFilter("ALL");
			setMaterialSearch("");
			submissionReference.current = `calc-${crypto.randomUUID()}`;
			setTimeout(() => document.getElementById("calculator-results")?.scrollIntoView({
				behavior: "smooth",
				block: "start"
			}), 50);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "The estimate could not be calculated.");
		} finally {
			setCalculating(false);
		}
	}
	async function requestQuotation(event) {
		event.preventDefault();
		if (!estimate) return;
		setQuoting(true);
		setError("");
		const data = new FormData(event.currentTarget);
		const requiredBy = String(data.get("requiredBy") ?? "");
		try {
			const response = await fetch(`/api/calculators/estimates/${encodeURIComponent(estimate.reference)}/quotation`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					name: String(data.get("name")),
					email: String(data.get("email")),
					phone: String(data.get("phone")),
					company: String(data.get("company")) || void 0,
					requiredBy: requiredBy || void 0,
					projectType: String(data.get("quotationProjectType")) || void 0,
					customerNotes: String(data.get("customerNotes")) || void 0
				})
			});
			const body = await response.json();
			if (!response.ok || !body.reference) throw new Error(body.message || "The quotation request could not be submitted.");
			setQuotationReference(body.reference);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "The quotation request could not be submitted.");
		} finally {
			setQuoting(false);
		}
	}
	function downloadBoq() {
		if (!estimate) return;
		const rows = [
			["Buildanta preliminary BOQ", estimate.reference],
			["Project", estimate.inputs.projectName],
			["Location", estimate.inputs.siteLocation],
			["Scope", scopeLabel(String(estimate.inputs.constructionScope))],
			["Total built-up area (sq ft)", estimate.inputs.totalBuiltUpAreaSqFt],
			["Formula version", estimate.version],
			[],
			[
				"Stage",
				"Material",
				"Product",
				"Raw requirement",
				"Formula unit",
				"Wastage",
				"Purchase quantity",
				"Purchase unit",
				"Unit price",
				"GST %",
				"Line total",
				"Availability"
			],
			...estimate.items.map((item) => [
				item.group,
				item.description,
				item.product?.name || "Staff selection required",
				item.rawQuantity,
				item.formulaUnitCode,
				item.wastageQuantity,
				item.purchaseQuantity,
				item.unitCode,
				item.unitPrice || "Request price",
				item.gstPercent || "",
				item.lineTotal || "",
				item.availabilityLabel
			]),
			[],
			["Material subtotal", estimate.subtotal || "Pending"],
			["GST snapshot", estimate.gstTotal || "Pending"],
			["Indicative total", estimate.indicativeTotal || "Pending"],
			[],
			["Important", estimate.disclaimer]
		];
		const blob = new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `${estimate.reference}-preliminary-boq.csv`;
		link.click();
		URL.revokeObjectURL(url);
	}
	function clearBoqFilters() {
		setStageFilter("ALL");
		setMaterialSearch("");
		requestAnimationFrame(() => document.getElementById("boq-stage-tabs")?.scrollTo({
			left: 0,
			behavior: "smooth"
		}));
	}
	function calculateAllStages() {
		const scope = document.querySelector("select[name=\"constructionScope\"]");
		if (!scope) return;
		scope.value = "FULL_FINISH";
		scope.dispatchEvent(new Event("change", { bubbles: true }));
		scope.scrollIntoView({
			behavior: "smooth",
			block: "center"
		});
		requestAnimationFrame(() => scope.form?.requestSubmit());
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `${calculator_module_default.workspace} ${estimate && isBuildingPlan ? calculator_module_default.workspaceWithBoq : ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: calculator_module_default.steps,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
					number: "1",
					label: isBuildingPlan ? "Project profile and scope" : "Project measurements",
					active: true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
					number: "2",
					label: "Review refined BOQ",
					active: Boolean(estimate)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
					number: "3",
					label: "Request final quotation",
					active: Boolean(quotationReference)
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `${calculator_module_default.layout} ${estimate && isBuildingPlan ? calculator_module_default.layoutWithBoq : ""}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: `${calculator_module_default.panel} ${calculator_module_default.inputPanel}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: calculator_module_default.panelHeader,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: calculator_module_default.panelIcon,
							"aria-hidden": "true",
							children: "01"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: calculator_module_default.panelEyebrow,
								children: estimate && isBuildingPlan ? "Edit inputs" : "Project brief"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: estimate && isBuildingPlan ? "Adjust project details" : isBuildingPlan ? "Build your preliminary project BOQ" : "Enter project measurements" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: calculator_module_default.muted,
								children: estimate && isBuildingPlan ? "Change any value and prepare the BOQ again to create a new estimate." : calculator.instructions
							})
						] })]
					}),
					isBuildingPlan && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: calculator_module_default.scopeNote,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Refined planning profile" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Project type, structural system, floor height and finish coverage now adjust the managed allowances. Final structural and MEP drawings remain mandatory." })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: calculate,
						className: calculator_module_default.formGrid,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Delivery PIN code",
								name: "deliveryPincode",
								inputMode: "numeric",
								pattern: "[0-9]{6}",
								maxLength: 6,
								defaultValue: "208001"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
								label: isBuildingPlan ? "Material quality tier" : "Material preference",
								name: "qualityTier",
								options: [
									["STANDARD", "Standard"],
									["ECONOMY", "Economy"],
									["PREMIUM", "Premium"]
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalculatorFields, { type: calculator.type }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Wastage allowance (%)",
								name: "wastagePercent",
								type: "number",
								min: "0",
								max: "20",
								step: "0.5",
								defaultValue: "5"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: `${calculator_module_default.primary} ${calculator_module_default.calculateButton} ${calculator_module_default.fieldWide}`,
								disabled: calculating,
								"aria-busy": calculating,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: calculating ? "Preparing your BOQ" : isBuildingPlan ? "Prepare refined BOQ" : "Calculate material requirement" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
									"aria-hidden": "true",
									children: calculating ? "..." : "->"
								})]
							})
						]
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: calculator_module_default.error,
						role: "alert",
						children: error
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: calculator_module_default.disclaimer,
						children: calculator.disclaimer
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: `${calculator_module_default.panel} ${calculator_module_default.resultPanel} ${estimate && isBuildingPlan ? calculator_module_default.boqPanel : ""} ${calculating ? calculator_module_default.resultLoading : ""}`,
				id: "calculator-results",
				"aria-busy": calculating,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: calculator_module_default.resultHeader,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: calculator_module_default.boqKicker,
								children: isBuildingPlan ? "PRELIMINARY BILL OF QUANTITIES" : "MATERIAL ESTIMATE"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: isBuildingPlan ? "Project BOQ schedule" : "Your material estimate" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: calculator_module_default.muted,
								children: estimate ? "A versioned material schedule connected to Buildanta Inventory." : "Complete the project brief to generate quantities, mapped products and indicative pricing."
							})
						] }), estimate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: calculator_module_default.readyBadge,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { "aria-hidden": "true" }), " Estimate ready"]
						})]
					}),
					estimate ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						isBuildingPlan && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: calculator_module_default.documentBar,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "BOQ reference" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: estimate.reference })] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Formula" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["Version ", estimate.version] })] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Delivery area" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["PIN ", estimate.deliveryPincode] })] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Valid until" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: new Intl.DateTimeFormat("en-IN", {
										day: "2-digit",
										month: "short",
										year: "numeric"
									}).format(new Date(estimate.expiresAt)) })] })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: calculator_module_default.costOverview,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: calculator_module_default.costHero,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Indicative project total" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: money(estimate.indicativeTotal) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Materials and GST snapshot. Freight is confirmed in the final quotation." })
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: calculator_module_default.costMetrics,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Materials" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: money(estimate.subtotal) })] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "GST snapshot" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: money(estimate.gstTotal) })] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Priced lines" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
											pricedLineCount,
											" of ",
											estimate.items.length
										] })] })
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
								className: calculator_module_default.projectSummary,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Project" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: String(estimate.inputs.projectName || "Project plan") }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: String(estimate.inputs.siteLocation || "Location not supplied") })
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Area and scope" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [Number(estimate.inputs.totalBuiltUpAreaSqFt || 0).toLocaleString("en-IN"), " sq ft"] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: scopeLabel(String(estimate.inputs.constructionScope || "")) })
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Build system" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: labelValue(estimate.inputs.structureSystem) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
											labelValue(estimate.inputs.projectType),
											" / ",
											String(estimate.inputs.floorHeightFt || "-"),
											" ft floor height"
										] })
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Material profile" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: labelValue(estimate.qualityTier) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [String(estimate.inputs.tileCoveragePercent || "-"), "% tile coverage"] })
									] })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: calculator_module_default.boqToolbar,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [estimate.items.length, " material lines"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Inventory-mapped and grouped by construction stage" })] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => window.print(),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											"aria-hidden": "true",
											children: "P"
										}), " Print"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: downloadBoq,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											"aria-hidden": "true",
											children: "D"
										}), " CSV"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: calculator_module_default.toolbarPrimary,
										onClick: () => document.getElementById("quote-request")?.scrollIntoView({ behavior: "smooth" }),
										children: ["Request quotation ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
											"aria-hidden": "true",
											children: "->"
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: calculator_module_default.boqFilters,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: calculator_module_default.materialSearch,
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Search BOQ" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												value: materialSearch,
												onChange: (event) => setMaterialSearch(event.target.value),
												placeholder: "Material, brand or SKU"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
												"aria-hidden": "true",
												children: "Q"
											})
										]
									}),
									String(estimate.inputs.constructionScope) !== "FULL_FINISH" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: calculator_module_default.scopeCoverageNotice,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [scopeLabel(String(estimate.inputs.constructionScope)), " is selected"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [String(estimate.inputs.constructionScope) === "FOUNDATION" ? "This estimate contains only the foundation stage." : "This estimate contains foundation and structural-shell stages.", " Choose the complete plan to include flooring, painting, electrical, plumbing, sanitaryware, doors and windows."] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: calculateAllStages,
											children: ["Calculate all stages ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "->" })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: calculator_module_default.stageTabs,
										id: "boq-stage-tabs",
										role: "group",
										"aria-label": "Filter BOQ by construction stage",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											className: stageFilter === "ALL" ? calculator_module_default.stageTabActive : "",
											"aria-pressed": stageFilter === "ALL",
											onClick: () => setStageFilter("ALL"),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "All stages" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: estimate.items.length })]
										}), groupedItems.map(([group, items], index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											className: stageFilter === group ? calculator_module_default.stageTabActive : "",
											"aria-pressed": stageFilter === group,
											onClick: () => setStageFilter(group),
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: String(index + 1).padStart(2, "0") }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: group }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: items.length })
											]
										}, group))]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: calculator_module_default.filterStatus,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
											"Showing ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: visibleLineCount }),
											" of ",
											estimate.items.length,
											" lines"
										] }), (stageFilter !== "ALL" || materialSearch) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: clearBoqFilters,
											children: "Clear filters"
										})]
									})
								]
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: calculator_module_default.boqTable,
							role: "table",
							"aria-label": "Preliminary bill of quantities",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: calculator_module_default.boqHead,
									role: "row",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "No." }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Material and Inventory product" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Calculated requirement" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Purchase quantity" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Rate" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Amount" })
									]
								}),
								visibleGroups.map(([group, items]) => {
									const groupTotal = items.every((item) => item.lineTotal != null) ? items.reduce((sum, item) => sum + Number(item.lineTotal), 0) : null;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										className: calculator_module_default.resultGroup,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: calculator_module_default.groupHeading,
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: calculator_module_default.stageNumber,
													children: String(groupedItems.findIndex(([name]) => name === group) + 1).padStart(2, "0")
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: group }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
													items.length,
													" material line",
													items.length === 1 ? "" : "s"
												] })] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: groupTotal == null ? "Price confirmation required" : money(String(groupTotal)) })
											]
										}), items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
											className: calculator_module_default.boqRow,
											role: "row",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: calculator_module_default.rowNumber,
													children: estimate.items.findIndex((entry) => entry.id === item.id) + 1
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: calculator_module_default.materialCell,
													children: [item.product?.image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
														src: item.product.image.src,
														alt: ""
													}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: item.description.slice(0, 1) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.product?.name || item.description }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: item.product ? `${item.product.brand} / ${item.variant?.sku || "Mapped product"}` : "Staff product selection required" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("em", { children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": "true" }),
															item.availabilityLabel,
															item.leadTimeLabel ? ` - ${item.leadTimeLabel}` : ""
														] })
													] })]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: calculator_module_default.quantityCell,
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: calculator_module_default.cellLabel,
															children: "Calculated"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", { children: [
															Number(item.rawQuantity).toLocaleString("en-IN", { maximumFractionDigits: 2 }),
															" ",
															item.formulaUnitCode
														] }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
															"Includes +",
															Number(item.wastageQuantity).toLocaleString("en-IN", { maximumFractionDigits: 2 }),
															" wastage"
														] })
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: calculator_module_default.purchaseCell,
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: calculator_module_default.cellLabel,
															children: "Purchase"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: Number(item.purchaseQuantity).toLocaleString("en-IN", { maximumFractionDigits: 2 }) }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [item.unitCode, item.packageSize ? ` / pack ${item.packageSize}` : ""] })
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: calculator_module_default.rateCell,
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: calculator_module_default.cellLabel,
															children: "Rate"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: money(item.unitPrice) }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: item.gstPercent ? `${item.gstPercent}% GST` : "GST confirmed in quote" })
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: calculator_module_default.amountCell,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: calculator_module_default.cellLabel,
														children: "Amount"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: money(item.lineTotal) })]
												})
											]
										}, item.id))]
									}, group);
								}),
								visibleGroups.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: calculator_module_default.noResults,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "0" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "No BOQ lines match" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Try a different material name or clear the active stage filter." }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: clearBoqFilters,
											children: "Show the complete BOQ"
										})
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
							className: calculator_module_default.assumptionDetails,
							open: true,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Calculation basis and professional checks" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [estimate.assumptions.length, " planning notes"] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: calculator_module_default.assumptions,
								children: estimate.assumptions.map((assumption) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: assumption }, assumption))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: calculator_module_default.quote,
							id: "quote-request",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: calculator_module_default.quoteIntro,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: calculator_module_default.quoteIcon,
									"aria-hidden": "true",
									children: "BQ"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: calculator_module_default.panelEyebrow,
										children: "Next step"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Turn this BOQ into a commercial quotation" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
										"Send all ",
										estimate.items.length,
										" mapped lines and this versioned calculation to the Buildanta Inventory team for price, freight and delivery confirmation."
									] })
								] })]
							}), quotationReference ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: calculator_module_default.success,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Quotation request received" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Reference: ", quotationReference] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Buildanta Inventory will verify all BOQ lines and prepare the final quotation. When it is ready, open your customer account to review the total and book the complete BOQ." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
										href: "/account",
										children: ["Track and book this BOQ ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "->" })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: "/signup",
										children: "Create customer account"
									})] })
								]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								onSubmit: requestQuotation,
								className: calculator_module_default.formGrid,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Your name",
										name: "name"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Phone",
										name: "phone",
										type: "tel"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Email",
										name: "email",
										type: "email",
										className: calculator_module_default.fieldWide
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Company (optional)",
										name: "company",
										required: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Required by (optional)",
										name: "requiredBy",
										type: "date",
										required: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
										label: "Project type",
										name: "quotationProjectType",
										options: [
											["Residential construction", "Residential construction"],
											["Commercial project", "Commercial project"],
											["Renovation", "Renovation"],
											["Contractor requirement", "Contractor requirement"]
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Notes (optional)",
										name: "customerNotes",
										required: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										className: `${calculator_module_default.primary} ${calculator_module_default.calculateButton} ${calculator_module_default.fieldWide}`,
										disabled: quoting,
										"aria-busy": quoting,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: quoting ? "Sending to Inventory" : "Request quotation for complete BOQ" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
											"aria-hidden": "true",
											children: quoting ? "..." : "->"
										})]
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: calculator_module_default.disclaimer,
							children: [
								"Estimate valid until ",
								new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(estimate.expiresAt)),
								". Final product selection, quantities, GST, freight, availability and delivery date are confirmed in the commercial quotation."
							]
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: calculator_module_default.boqEmpty,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: calculator_module_default.emptyDocument,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "BOQ" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: calculator_module_default.panelEyebrow,
								children: "Your result will appear here"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "One project brief. One clear material schedule." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Buildanta will organize your requirements by construction stage, match Inventory products, and prepare an indicative cost snapshot." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: calculator_module_default.emptyFlow,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "01" }), " Quantities"] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "02" }), " Products"] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "03" }), " Pricing"] })
								]
							})
						]
					}),
					calculating && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: calculator_module_default.loadingOverlay,
						role: "status",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: calculator_module_default.loadingMark }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Building your material schedule" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Calculating quantities and matching Inventory products..." })
						]
					})
				]
			})]
		})]
	});
}
function CalculatorFields({ type }) {
	if (type === "BUILDING_BUDGET") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `${calculator_module_default.formSectionTitle} ${calculator_module_default.fieldWide}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "1" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Project basics" })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Project name",
			name: "projectName",
			placeholder: "Example: Singh family home",
			className: calculator_module_default.fieldWide
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Site location / city",
			name: "siteLocation",
			placeholder: "Example: Kanpur, Uttar Pradesh",
			className: calculator_module_default.fieldWide
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
			label: "Project use",
			name: "projectType",
			options: [["RESIDENTIAL", "Residential"], ["COMMERCIAL", "Commercial"]]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
			label: "Structural system",
			name: "structureSystem",
			options: [["RCC_FRAME", "RCC framed structure"], ["LOAD_BEARING", "Load-bearing masonry"]]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `${calculator_module_default.formSectionTitle} ${calculator_module_default.fieldWide}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "2" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Area and accommodation" })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Plot area (sq ft)",
			name: "plotAreaSqFt",
			type: "number",
			min: "100",
			max: "1000000",
			step: "1",
			defaultValue: "1500"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Built-up area per floor (sq ft)",
			name: "builtUpAreaSqFt",
			type: "number",
			min: "100",
			max: "500000",
			step: "1",
			defaultValue: "1000"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Number of floors",
			name: "floors",
			type: "number",
			min: "1",
			max: "20",
			step: "1",
			defaultValue: "1"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Floor-to-floor height (ft)",
			name: "floorHeightFt",
			type: "number",
			min: "8",
			max: "20",
			step: "0.5",
			defaultValue: "10"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Total rooms",
			name: "rooms",
			type: "number",
			min: "1",
			max: "200",
			step: "1",
			defaultValue: "4"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Bathrooms",
			name: "bathrooms",
			type: "number",
			min: "0",
			max: "100",
			step: "1",
			defaultValue: "2"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Kitchens",
			name: "kitchens",
			type: "number",
			min: "0",
			max: "20",
			step: "1",
			defaultValue: "1"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
			label: "Construction requirement",
			name: "constructionScope",
			defaultValue: "FULL_FINISH",
			options: [
				["FOUNDATION", "Foundation only"],
				["STRUCTURE", "Foundation + structural shell"],
				["FULL_FINISH", "Full finished material plan"]
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `${calculator_module_default.formSectionTitle} ${calculator_module_default.fieldWide}`,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "3" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Finish assumptions" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Applied only to the full-finish scope" })
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Tile coverage of built-up area (%)",
			name: "tileCoveragePercent",
			type: "number",
			min: "0",
			max: "100",
			step: "1",
			defaultValue: "70"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: calculator_module_default.check,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				name: "includeCeilingPaint",
				type: "checkbox",
				defaultChecked: true
			}), " Include ceiling painting"]
		})
	] });
	if (type === "CEMENT_CONCRETE") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
			label: "Concrete component",
			name: "componentType",
			options: [
				["SLAB", "Slab"],
				["FOOTING", "Footing"],
				["BEAM", "Beam"],
				["COLUMN", "Column"],
				["OTHER", "Other"]
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Number of identical components",
			name: "quantity",
			type: "number",
			min: "1",
			step: "1",
			defaultValue: "1"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Length (metres)",
			name: "lengthM",
			type: "number",
			min: "0.01",
			step: "0.01",
			defaultValue: "5"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Width (metres)",
			name: "widthM",
			type: "number",
			min: "0.01",
			step: "0.01",
			defaultValue: "4"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Thickness / depth (metres)",
			name: "thicknessM",
			type: "number",
			min: "0.01",
			max: "20",
			step: "0.01",
			defaultValue: "0.1"
		})
	] });
	if (type === "BRICKS_BLOCKS") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
			label: "Masonry material",
			name: "material",
			options: [["BRICK", "Red clay brick"], ["AAC_BLOCK", "AAC block"]]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Number of identical walls",
			name: "quantity",
			type: "number",
			min: "1",
			step: "1",
			defaultValue: "1"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Wall length (metres)",
			name: "wallLengthM",
			type: "number",
			min: "0.01",
			step: "0.01",
			defaultValue: "5"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Wall height (metres)",
			name: "wallHeightM",
			type: "number",
			min: "0.01",
			step: "0.01",
			defaultValue: "3"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Wall thickness (metres)",
			name: "wallThicknessM",
			type: "number",
			min: "0.01",
			max: "2",
			step: "0.005",
			defaultValue: "0.115"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Openings per wall (sq m)",
			name: "openingsAreaM2",
			type: "number",
			min: "0",
			step: "0.01",
			defaultValue: "2"
		})
	] });
	if (type === "TILES_FLOORING") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
			label: "Surface",
			name: "surfaceType",
			options: [["FLOOR", "Floor"], ["WALL", "Wall"]]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Number of identical surfaces",
			name: "quantity",
			type: "number",
			min: "1",
			step: "1",
			defaultValue: "1"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Surface length (metres)",
			name: "lengthM",
			type: "number",
			min: "0.01",
			step: "0.01",
			defaultValue: "5"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Surface width / height (metres)",
			name: "widthM",
			type: "number",
			min: "0.01",
			step: "0.01",
			defaultValue: "4"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Openings per surface (sq m)",
			name: "openingsAreaM2",
			type: "number",
			min: "0",
			step: "0.01",
			defaultValue: "0"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Tile length (metres)",
			name: "tileLengthM",
			type: "number",
			min: "0.01",
			max: "5",
			step: "0.01",
			defaultValue: "0.6"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Tile width (metres)",
			name: "tileWidthM",
			type: "number",
			min: "0.01",
			max: "5",
			step: "0.01",
			defaultValue: "0.6"
		})
	] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Number of identical rooms",
			name: "quantity",
			type: "number",
			min: "1",
			step: "1",
			defaultValue: "1"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Room length (metres)",
			name: "roomLengthM",
			type: "number",
			min: "0.01",
			step: "0.01",
			defaultValue: "5"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Room width (metres)",
			name: "roomWidthM",
			type: "number",
			min: "0.01",
			step: "0.01",
			defaultValue: "4"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Wall height (metres)",
			name: "wallHeightM",
			type: "number",
			min: "0.01",
			max: "30",
			step: "0.01",
			defaultValue: "3"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Doors and windows (sq m)",
			name: "openingsAreaM2",
			type: "number",
			min: "0",
			step: "0.01",
			defaultValue: "4"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Finish paint coats",
			name: "paintCoats",
			type: "number",
			min: "1",
			max: "5",
			step: "1",
			defaultValue: "2"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Primer coats",
			name: "primerCoats",
			type: "number",
			min: "0",
			max: "3",
			step: "1",
			defaultValue: "1"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: "Putty coats",
			name: "puttyCoats",
			type: "number",
			min: "0",
			max: "3",
			step: "1",
			defaultValue: "2"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: calculator_module_default.check,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				name: "includeCeiling",
				type: "checkbox"
			}), " Include ceiling area"]
		})
	] });
}
function Step({ number, label, active = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: `${calculator_module_default.step} ${active ? calculator_module_default.stepActive : ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: number }), label]
	});
}
function Field({ label, className = "", required = true, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: `${calculator_module_default.field} ${className}`,
		children: [label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			required,
			...props
		})]
	});
}
function Select({ label, name, options, defaultValue }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: calculator_module_default.field,
		children: [label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
			name,
			required: true,
			defaultValue,
			children: options.map(([value, text]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
				value,
				children: text
			}, value))
		})]
	});
}
//#endregion
export { CalculatorWizard };
