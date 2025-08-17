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
  change_type: 'Added' | 'Modified' | 'Deprecated' | 'Removed' | 'Bug Fix' | 'Security Fix' | 'Test Fix' | 'Compatibility' | 'Security Enhancement';
  description: string;
  summary_ja: string;
  source_url?: string;
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
  change_type: 'Added' | 'Modified' | 'Deprecated' | 'Removed' | 'Bug Fix' | 'Security Fix' | 'Test Fix' | 'Compatibility' | 'Security Enhancement';
  description: string;
  summary_ja: string;
  source_url?: string;
}

import { Node, Edge, MarkerType } from 'reactflow';

export interface FlowNodeData {
  label: string;
  package: string;
  version: string;
  changeType: 'Added' | 'Modified' | 'Deprecated' | 'Removed' | 'Bug Fix' | 'Security Fix' | 'Test Fix' | 'Compatibility' | 'Security Enhancement';
  description: string;
  summaryJa: string;
  releaseDate: string;
  sourceUrl?: string;
}

export type FlowNode = Node<FlowNodeData>;

export type FlowEdge = Edge;