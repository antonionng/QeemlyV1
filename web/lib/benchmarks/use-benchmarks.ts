"use client";

import { useCallback, useMemo, useState } from "react";
import { getDefaultBenchmarkLayout, getBenchmarkPreset, BENCHMARK_PRESET_LAYOUTS, type GridLayoutItem } from "./preset-layouts";
import { ALL_BENCHMARK_WIDGET_IDS } from "./widget-registry";
import { generateBenchmark, LOCATIONS, LEVELS, ROLES } from "@/lib/dashboard/dummy-data";
import { useSalaryView } from "@/lib/salary-view-store";

// Version the storage keys to invalidate cache when layout structure changes
const STORAGE_VERSION = "v2";
const STORAGE_KEY_LAYOUT = `qeemly:benchmarkLayout:${STORAGE_VERSION}`;
const STORAGE_KEY_WIDGETS = `qeemly:benchmarkWidgets:${STORAGE_VERSION}`;
const STORAGE_KEY_PRESET = `qeemly:benchmarkPreset:${STORAGE_VERSION}`;

function useLocalStorageState<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setStateAndStorage = useCallback((value: T | ((prev: T) => T)) => {
    setState(prev => {
      const newValue = typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch {
        // Ignore storage errors
      }
      return newValue;
    });
  }, [key]);

  return [state, setStateAndStorage];
}

export function useBenchmarks() {
  const defaultPreset = getDefaultBenchmarkLayout();
  
  // Layout state
  const [currentPresetId, setCurrentPresetId] = useLocalStorageState<string>(
    STORAGE_KEY_PRESET,
    defaultPreset.id
  );
  
  const [activeWidgets, setActiveWidgets] = useLocalStorageState<string[]>(
    STORAGE_KEY_WIDGETS,
    defaultPreset.widgets
  );
  
  const [layout, setLayout] = useLocalStorageState<GridLayoutItem[]>(
    STORAGE_KEY_LAYOUT,
    defaultPreset.layout
  );
  
  const [isCustomized, setIsCustomized] = useState(false);

  // Benchmark filter state
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(ROLES[0]?.id || null);
  const [selectedLocationId, setSelectedLocationId] = useState(LOCATIONS[0]?.id || "dubai");
  const [selectedLevelId, setSelectedLevelId] = useState("ic3");
  const [searchQuery, setSearchQuery] = useState("");
  const [offerTarget, setOfferTarget] = useState(75);
  const { salaryView, setSalaryView } = useSalaryView();

  // Computed benchmark data
  const selectedBenchmark = useMemo(() => {
    if (!selectedRoleId) return null;
    return generateBenchmark(selectedRoleId, selectedLocationId, selectedLevelId);
  }, [selectedRoleId, selectedLocationId, selectedLevelId]);

  const selectedRole = useMemo(() => {
    return ROLES.find(r => r.id === selectedRoleId) || null;
  }, [selectedRoleId]);

  const selectedLocation = useMemo(() => {
    return LOCATIONS.find(l => l.id === selectedLocationId) || null;
  }, [selectedLocationId]);

  const selectedLevel = useMemo(() => {
    return LEVELS.find(l => l.id === selectedLevelId) || null;
  }, [selectedLevelId]);

  // Offer calculations
  const offerValue = useMemo(() => {
    if (!selectedBenchmark) return 0;
    if (offerTarget >= 90) return selectedBenchmark.percentiles.p90;
    if (offerTarget >= 75) return selectedBenchmark.percentiles.p75;
    if (offerTarget >= 50) return selectedBenchmark.percentiles.p50;
    if (offerTarget >= 25) return selectedBenchmark.percentiles.p25;
    return selectedBenchmark.percentiles.p10;
  }, [selectedBenchmark, offerTarget]);

  const offerRange = useMemo(() => ({
    low: Math.round(offerValue * 0.96),
    high: Math.round(offerValue * 1.04),
  }), [offerValue]);

  // Layout actions
  const applyPreset = useCallback((presetId: string) => {
    const preset = getBenchmarkPreset(presetId);
    if (!preset) return;
    
    setCurrentPresetId(presetId);
    setActiveWidgets(preset.widgets);
    setLayout(preset.layout);
    setIsCustomized(false);
  }, [setCurrentPresetId, setActiveWidgets, setLayout]);

  const updateLayout = useCallback((newLayout: GridLayoutItem[]) => {
    setLayout(newLayout);
    setIsCustomized(true);
  }, [setLayout]);

  const addWidget = useCallback((widgetId: string) => {
    if (activeWidgets.includes(widgetId)) return;
    
    // New widgets take half width (6 cols) for 2x2 grid snapping
    const newLayoutItem: GridLayoutItem = {
      i: widgetId,
      x: (activeWidgets.length % 2) * 6, // Alternate left/right
      y: Infinity,
      w: 6,
      h: 3,
      minW: 3,
      minH: 2,
    };
    
    setActiveWidgets(prev => [...prev, widgetId]);
    setLayout(prev => [...prev, newLayoutItem]);
    setIsCustomized(true);
  }, [activeWidgets, setActiveWidgets, setLayout]);

  const removeWidget = useCallback((widgetId: string) => {
    setActiveWidgets(prev => prev.filter(id => id !== widgetId));
    setLayout(prev => prev.filter(item => item.i !== widgetId));
    setIsCustomized(true);
  }, [setActiveWidgets, setLayout]);

  const toggleWidget = useCallback((widgetId: string) => {
    if (activeWidgets.includes(widgetId)) {
      removeWidget(widgetId);
    } else {
      addWidget(widgetId);
    }
  }, [activeWidgets, addWidget, removeWidget]);

  const resetToDefault = useCallback(() => {
    applyPreset(defaultPreset.id);
  }, [applyPreset, defaultPreset.id]);

  // Role selection
  const selectRole = useCallback((roleId: string) => {
    setSelectedRoleId(roleId);
  }, []);

  const availablePresets = BENCHMARK_PRESET_LAYOUTS;
  const availableWidgets = ALL_BENCHMARK_WIDGET_IDS;
  const inactiveWidgets = availableWidgets.filter(id => !activeWidgets.includes(id));

  return {
    // Layout state
    currentPresetId,
    activeWidgets,
    layout,
    isCustomized,
    availablePresets,
    availableWidgets,
    inactiveWidgets,
    
    // Benchmark filter state
    selectedRoleId,
    selectedLocationId,
    selectedLevelId,
    searchQuery,
    offerTarget,
    salaryView,
    
    // Computed data
    selectedBenchmark,
    selectedRole,
    selectedLocation,
    selectedLevel,
    offerValue,
    offerRange,
    
    // Layout actions
    applyPreset,
    updateLayout,
    addWidget,
    removeWidget,
    toggleWidget,
    resetToDefault,
    
    // Benchmark actions
    selectRole,
    setSelectedLocationId,
    setSelectedLevelId,
    setSearchQuery,
    setOfferTarget,
    setSalaryView,
  };
}

export type BenchmarksState = ReturnType<typeof useBenchmarks>;
