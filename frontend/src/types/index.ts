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
}

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    package: string;
    version: string;
    changeType: 'Added' | 'Modified' | 'Deprecated' | 'Removed';
    description: string;
    releaseDate: string;
  };
  style?: React.CSSProperties;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  style?: React.CSSProperties;
  markerEnd?: {
    type: string;
    color?: string;
  };
}