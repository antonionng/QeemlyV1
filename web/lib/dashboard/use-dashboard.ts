"use client";

import { useCallback, useState } from "react";
import { getDefaultLayout, getPreset, PRESET_LAYOUTS, type GridLayoutItem } from "./preset-layouts";
import { ALL_WIDGET_IDS } from "./widget-registry";

const STORAGE_KEY_LAYOUT = "qeemly:dashboardLayout";
const STORAGE_KEY_WIDGETS = "qeemly:dashboardWidgets";
const STORAGE_KEY_PRESET = "qeemly:dashboardPreset";

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

export function useDashboard() {
  const defaultPreset = getDefaultLayout();
  
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

  const applyPreset = useCallback((presetId: string) => {
    const preset = getPreset(presetId);
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
    
    // Find a spot for the new widget
    const newLayoutItem: GridLayoutItem = {
      i: widgetId,
      x: 0,
      y: Infinity, // Will be pushed to bottom
      w: 4,
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
    applyPreset(defaultPreset.id);
  }, [applyPreset, defaultPreset.id]);

  const availablePresets = PRESET_LAYOUTS;
  const availableWidgets = ALL_WIDGET_IDS;
  const inactiveWidgets = availableWidgets.filter(id => !activeWidgets.includes(id));

  return {
    // State
    currentPresetId,
    activeWidgets,
    layout,
    isCustomized,
    availablePresets,
    availableWidgets,
    inactiveWidgets,
    
    // Actions
    applyPreset,
    updateLayout,
    addWidget,
    removeWidget,
    toggleWidget,
    resetToDefault,
  };
}

export type DashboardState = ReturnType<typeof useDashboard>;

