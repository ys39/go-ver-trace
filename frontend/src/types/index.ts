export interface Release {
  id: number;
  version: string;
  release_date: string;
  url: string;
  created_at: string;
}

export interface PackageChange {
  id: number;
  release_id: number;
  package: string;
  change_type: 'Added' | 'Modified' | 'Deprecated' | 'Removed';
  description: string;
  summary_ja: string;
  created_at: string;
}

export interface VisualizationData {
  releases: Release[];
  packages: string[];
  package_evolution: Record<string, PackageVersionChange[]>;
}

export interface PackageVersionChange {
  version: string;
  release_date: string;
  change_type: 'Added' | 'Modified' | 'Deprecated' | 'Removed';
  description: string;
  summary_ja: string;
}

import { Node, Edge, MarkerType } from 'reactflow';

export interface FlowNodeData {
  label: string;
  package: string;
  version: string;
  changeType: 'Added' | 'Modified' | 'Deprecated' | 'Removed';
  description: string;
  summaryJa: string;
  releaseDate: string;
}

export type FlowNode = Node<FlowNodeData>;

export type FlowEdge = Edge;