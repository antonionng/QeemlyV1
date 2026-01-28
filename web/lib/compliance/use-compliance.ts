"use client";

import { useCallback, useState, useMemo } from "react";
import { COMPLIANCE_PRESETS, DEFAULT_COMPLIANCE_PRESET_ID, type GridLayoutItem } from "./preset-layouts";
import { ALL_COMPLIANCE_WIDGET_IDS } from "./widget-registry";

const STORAGE_VERSION = "v1";
const STORAGE_KEY_LAYOUT = `qeemly:complianceLayout:${STORAGE_VERSION}`;
const STORAGE_KEY_WIDGETS = `qeemly:complianceWidgets:${STORAGE_VERSION}`;
const STORAGE_KEY_PRESET = `qeemly:compliancePreset:${STORAGE_VERSION}`;

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

export function useCompliance() {
  const defaultPreset = COMPLIANCE_PRESETS[DEFAULT_COMPLIANCE_PRESET_ID];
  
  const [currentPresetId, setCurrentPresetId] = useLocalStorageState<string>(
    STORAGE_KEY_PRESET,
    DEFAULT_COMPLIANCE_PRESET_ID
  );
  
  const [activeWidgets, setActiveWidgets] = useLocalStorageState<string[]>(
    STORAGE_KEY_WIDGETS,
    defaultPreset.layout.map(item => item.i)
  );
  
  const [layout, setLayout] = useLocalStorageState<GridLayoutItem[]>(
    STORAGE_KEY_LAYOUT,
    defaultPreset.layout
  );
  
  const [isCustomized, setIsCustomized] = useState(false);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState("UAE");

  const applyPreset = useCallback((presetId: string) => {
    const preset = COMPLIANCE_PRESETS[presetId];
    if (!preset) return;
    
    setCurrentPresetId(presetId);
    setActiveWidgets(preset.layout.map(item => item.i));
    setLayout(preset.layout);
    setIsCustomized(false);
  }, [setCurrentPresetId, setActiveWidgets, setLayout]);

  const updateLayout = useCallback((newLayout: GridLayoutItem[]) => {
    setLayout(newLayout);
    setIsCustomized(true);
  }, [setLayout]);

  const addWidget = useCallback((widgetId: string) => {
    if (activeWidgets.includes(widgetId)) return;
    
    const newLayoutItem: GridLayoutItem = {
      i: widgetId,
      x: (activeWidgets.length % 2) * 6,
      y: Infinity,
      w: 6,
      h: 3,
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
    applyPreset(DEFAULT_COMPLIANCE_PRESET_ID);
  }, [applyPreset]);

  return {
    currentPresetId,
    activeWidgets,
    layout,
    isCustomized,
    selectedJurisdiction,
    setSelectedJurisdiction,
    applyPreset,
    updateLayout,
    addWidget,
    removeWidget,
    toggleWidget,
    resetToDefault,
    availablePresets: COMPLIANCE_PRESETS,
    availableWidgets: ALL_COMPLIANCE_WIDGET_IDS,
  };
}

export type ComplianceState = ReturnType<typeof useCompliance>;
