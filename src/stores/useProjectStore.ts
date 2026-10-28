import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, WallMeasurement, CeilingMeasurement, MaterialPrices, LaborCosts } from '../types';
import { DEFAULT_PRICES, DEFAULT_LABOR_COSTS } from '../utils/constants';
import {
  calculateWallMaterials,
  calculateCeilingMaterials,
  mergeMaterials,
  calculateTotalCost,
  calculateLaborCost,
} from '../utils/calculations';

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

  // Walls
  addWall: (wall: WallMeasurement) => void;
  updateWall: (wallId: string, updates: Partial<WallMeasurement>) => void;
  removeWall: (wallId: string) => void;

  // Ceilings
  addCeiling: (ceiling: CeilingMeasurement) => void;
  updateCeiling: (ceilingId: string, updates: Partial<CeilingMeasurement>) => void;
  removeCeiling: (ceilingId: string) => void;

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

      addWall: (wall) => {
        set((state) => {
          if (!state.currentProject) return state;
          const updated = {
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
          const updated = {
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
          const updated = {
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
          const updated = {
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
          const updated = {
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
          const updated = {
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

        const wallMaterials = state.currentProject.walls.map((w) =>
          calculateWallMaterials(w, prices)
        );
        const ceilingMaterials = state.currentProject.ceilings.map((c) =>
          calculateCeilingMaterials(c, prices)
        );

        const allMaterials = mergeMaterials([...wallMaterials, ...ceilingMaterials]);
        const materialsCost = calculateTotalCost(allMaterials);

        // Labor calculation
        const laborResult = calculateLaborCost(
          state.currentProject.walls,
          state.currentProject.ceilings,
          labor
        );
        const laborCost = laborResult.totalLabor;

        // Subtotal & Profit/Contingency margin
        const subtotal = materialsCost + laborCost;
        const profitAmount = labor.includeLabor
          ? (subtotal * (labor.profitMarginPercent || 0)) / 100
          : 0;
        const totalCost = Math.round((subtotal + profitAmount) * 100) / 100;

        set((s) => {
          const updated: Project = {
            ...s.currentProject!,
            materials: allMaterials,
            materialsCost: Math.round(materialsCost * 100) / 100,
            laborCost,
            profitAmount: Math.round(profitAmount * 100) / 100,
            totalCost,
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
