import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Project,
  WallMeasurement,
  CeilingMeasurement,
  ElectricalItem,
  MaterialPrices,
  LaborCosts,
  CrewSize,
} from '../types';
import { DEFAULT_PRICES, DEFAULT_LABOR_COSTS } from '../utils/constants';
import {
  calculateWallMaterials,
  calculateCeilingMaterials,
  calculatePaintingMaterials,
  mergeMaterials,
  calculateTotalCost,
  calculateLaborCost,
} from '../utils/calculations';
import {
  calculateElectricalMaterials,
  calculateElectricalLabor,
} from '../utils/electricalCalculations';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  prices: MaterialPrices;
  laborCosts: LaborCosts;
  geminiApiKey: string;

  // Project CRUD
  createProject: (name: string, client: string, description: string) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (id: string | null) => void;

  // Options & Features
  togglePaintFinishing: (enabled: boolean) => void;
  setCrewSize: (crew: CrewSize) => void;

  // Walls
  addWall: (wall: WallMeasurement) => void;
  updateWall: (wallId: string, updates: Partial<WallMeasurement>) => void;
  removeWall: (wallId: string) => void;

  // Ceilings
  addCeiling: (ceiling: CeilingMeasurement) => void;
  updateCeiling: (ceilingId: string, updates: Partial<CeilingMeasurement>) => void;
  removeCeiling: (ceilingId: string) => void;

  // Electrical Items (Separado de Drywall)
  addElectricalItem: (item: ElectricalItem) => void;
  updateElectricalItem: (id: string, updates: Partial<ElectricalItem>) => void;
  removeElectricalItem: (id: string) => void;

  // Sketch import
  importFromSketch: (
    walls: WallMeasurement[],
    ceilings: CeilingMeasurement[],
    sketchImage?: string,
    projectName?: string
  ) => void;

  // Prices & Labor & API Key
  updatePrices: (prices: Partial<MaterialPrices>) => void;
  updateLaborCosts: (costs: Partial<LaborCosts>) => void;
  setGeminiApiKey: (key: string) => void;

  // Calculate
  recalculate: () => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProject: null,
      prices: DEFAULT_PRICES,
      laborCosts: DEFAULT_LABOR_COSTS,
      geminiApiKey: 'AIzaSyDAR9JEpDaeu2RlYun_u7HWDKawPaD0w2w',

      createProject: (name, client, description) => {
        const project: Project = {
          id: generateId(),
          name,
          client,
          description,
          date: new Date().toISOString().split('T')[0],
          walls: [],
          ceilings: [],
          materials: [],
          materialsCost: 0,
          laborCost: 0,
          profitAmount: 0,
          totalCost: 0,
          includePaintFinishing: false,
          crewSize: '1_maestro_1_ayudante',
          // Electrical
          electricalItems: [],
          electricalMaterials: [],
          electricalMaterialsCost: 0,
          electricalLaborCost: 0,
          electricalTotalCost: 0,
          laborSettings: get().laborCosts,
          status: 'borrador',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          projects: [...state.projects, project],
          currentProject: project,
        }));
        return project;
      },

      updateProject: (id, updates) => {
        set((state) => {
          const projects = state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          );
          const currentProject =
            state.currentProject?.id === id
              ? { ...state.currentProject, ...updates, updatedAt: new Date().toISOString() }
              : state.currentProject;
          return { projects, currentProject };
        });
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
        }));
      },

      setCurrentProject: (id) => {
        set((state) => ({
          currentProject: id ? state.projects.find((p) => p.id === id) || null : null,
        }));
      },

      togglePaintFinishing: (enabled) => {
        set((state) => {
          if (!state.currentProject) return state;
          const updated: Project = {
            ...state.currentProject,
            includePaintFinishing: enabled,
            updatedAt: new Date().toISOString(),
          };
          return {
            currentProject: updated,
            projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
          };
        });
        get().recalculate();
      },

      setCrewSize: (crew) => {
        set((state) => {
          if (!state.currentProject) return state;
          const updated: Project = {
            ...state.currentProject,
            crewSize: crew,
            updatedAt: new Date().toISOString(),
          };
          return {
            currentProject: updated,
            projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
          };
        });
      },

      addWall: (wall) => {
        set((state) => {
          if (!state.currentProject) return state;
          const updated: Project = {
            ...state.currentProject,
            walls: [...state.currentProject.walls, wall],
            updatedAt: new Date().toISOString(),
          };
          return {
            currentProject: updated,
            projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
          };
        });
        get().recalculate();
      },

      updateWall: (wallId, updates) => {
        set((state) => {
          if (!state.currentProject) return state;
          const updated: Project = {
            ...state.currentProject,
            walls: state.currentProject.walls.map((w) =>
              w.id === wallId ? { ...w, ...updates } : w
            ),
            updatedAt: new Date().toISOString(),
          };
          return {
            currentProject: updated,
            projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
          };
        });
        get().recalculate();
      },

      removeWall: (wallId) => {
        set((state) => {
          if (!state.currentProject) return state;
          const updated: Project = {
            ...state.currentProject,
            walls: state.currentProject.walls.filter((w) => w.id !== wallId),
            updatedAt: new Date().toISOString(),
          };
          return {
            currentProject: updated,
            projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
          };
        });
        get().recalculate();
      },

      addCeiling: (ceiling) => {
        set((state) => {
          if (!state.currentProject) return state;
          const updated: Project = {
            ...state.currentProject,
            ceilings: [...state.currentProject.ceilings, ceiling],
            updatedAt: new Date().toISOString(),
          };
          return {
            currentProject: updated,
            projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
          };
        });
        get().recalculate();
      },

      updateCeiling: (ceilingId, updates) => {
        set((state) => {
          if (!state.currentProject) return state;
          const updated: Project = {
            ...state.currentProject,
            ceilings: state.currentProject.ceilings.map((c) =>
              c.id === ceilingId ? { ...c, ...updates } : c
            ),
            updatedAt: new Date().toISOString(),
          };
          return {
            currentProject: updated,
            projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
          };
        });
        get().recalculate();
      },

      removeCeiling: (ceilingId) => {
        set((state) => {
          if (!state.currentProject) return state;
          const updated: Project = {
            ...state.currentProject,
            ceilings: state.currentProject.ceilings.filter((c) => c.id !== ceilingId),
            updatedAt: new Date().toISOString(),
          };
          return {
            currentProject: updated,
            projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
          };
        });
        get().recalculate();
      },

      // Electrical actions
      addElectricalItem: (item) => {
        set((state) => {
          if (!state.currentProject) return state;
          const prevItems = state.currentProject.electricalItems || [];
          const updated: Project = {
            ...state.currentProject,
            electricalItems: [...prevItems, item],
            updatedAt: new Date().toISOString(),
          };
          return {
            currentProject: updated,
            projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
          };
        });
        get().recalculate();
      },

      updateElectricalItem: (id, updates) => {
        set((state) => {
          if (!state.currentProject) return state;
          const prevItems = state.currentProject.electricalItems || [];
          const updated: Project = {
            ...state.currentProject,
            electricalItems: prevItems.map((it) => (it.id === id ? { ...it, ...updates } : it)),
            updatedAt: new Date().toISOString(),
          };
          return {
            currentProject: updated,
            projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
          };
        });
        get().recalculate();
      },

      removeElectricalItem: (id) => {
        set((state) => {
          if (!state.currentProject) return state;
          const prevItems = state.currentProject.electricalItems || [];
          const updated: Project = {
            ...state.currentProject,
            electricalItems: prevItems.filter((it) => it.id !== id),
            updatedAt: new Date().toISOString(),
          };
          return {
            currentProject: updated,
            projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
          };
        });
        get().recalculate();
      },

      importFromSketch: (walls, ceilings, sketchImage, projectName) => {
        const state = get();
        if (state.currentProject) {
          const updated: Project = {
            ...state.currentProject,
            name: projectName || state.currentProject.name,
            walls: [...state.currentProject.walls, ...walls],
            ceilings: [...state.currentProject.ceilings, ...ceilings],
            sketchImage: sketchImage || state.currentProject.sketchImage,
            updatedAt: new Date().toISOString(),
          };
          set((s) => ({
            currentProject: updated,
            projects: s.projects.map((p) => (p.id === updated.id ? updated : p)),
          }));
        } else {
          const newProj = state.createProject(
            projectName || 'Proyecto desde Dibujo IA',
            'Cliente Escaneado',
            'Detectado a partir de foto de dibujo a mano'
          );
          const updated: Project = {
            ...newProj,
            walls,
            ceilings,
            sketchImage,
          };
          set((s) => ({
            currentProject: updated,
            projects: s.projects.map((p) => (p.id === updated.id ? updated : p)),
          }));
        }
        get().recalculate();
      },

      updatePrices: (newPrices) => {
        set((state) => ({
          prices: { ...state.prices, ...newPrices },
        }));
        get().recalculate();
      },

      updateLaborCosts: (newLabor) => {
        set((state) => ({
          laborCosts: { ...state.laborCosts, ...newLabor },
        }));
        get().recalculate();
      },

      setGeminiApiKey: (key) => {
        set({ geminiApiKey: key });
      },

      recalculate: () => {
        const state = get();
        if (!state.currentProject) return;

        const prices = state.prices;
        const labor = state.laborCosts;
        const proj = state.currentProject;

        // 1. Drywall Calculations
        const wallMaterials = proj.walls.map((w) => calculateWallMaterials(w, prices));
        const ceilingMaterials = proj.ceilings.map((c) => calculateCeilingMaterials(c, prices));
        const paintMaterials = proj.includePaintFinishing
          ? calculatePaintingMaterials(proj.walls, proj.ceilings, prices)
          : [];

        const allMaterials = mergeMaterials([
          ...wallMaterials,
          ...ceilingMaterials,
          paintMaterials,
        ]);
        const materialsCost = calculateTotalCost(allMaterials);

        // Drywall Labor
        const laborResult = calculateLaborCost(
          proj.walls,
          proj.ceilings,
          labor,
          proj.includePaintFinishing
        );
        const laborCost = laborResult.totalLabor;

        // Subtotal & Profit/Contingency margin for Drywall
        const subtotal = materialsCost + laborCost;
        const profitAmount = labor.includeLabor
          ? (subtotal * (labor.profitMarginPercent || 0)) / 100
          : 0;
        const totalCost = Math.round((subtotal + profitAmount) * 100) / 100;

        // 2. Electrical Calculations (100% Separado de Drywall)
        const electricalItems = proj.electricalItems || [];
        const electricalMaterials = calculateElectricalMaterials(electricalItems, prices);
        const electricalMaterialsCost = calculateTotalCost(electricalMaterials);
        const electricalLaborResult = calculateElectricalLabor(electricalItems, labor);
        const electricalLaborCost = electricalLaborResult.totalLabor;
        const electricalTotalCost = Math.round((electricalMaterialsCost + electricalLaborCost) * 100) / 100;

        set((s) => {
          const updated: Project = {
            ...s.currentProject!,
            // Drywall
            materials: allMaterials,
            materialsCost: Math.round(materialsCost * 100) / 100,
            laborCost,
            profitAmount: Math.round(profitAmount * 100) / 100,
            totalCost,
            // Electrical
            electricalMaterials,
            electricalMaterialsCost: Math.round(electricalMaterialsCost * 100) / 100,
            electricalLaborCost,
            electricalTotalCost,
            laborSettings: labor,
            updatedAt: new Date().toISOString(),
          };
          return {
            currentProject: updated,
            projects: s.projects.map((p) => (p.id === updated.id ? updated : p)),
          };
        });
      },
    }),
    {
      name: 'drywall-projects-storage',
    }
  )
);
