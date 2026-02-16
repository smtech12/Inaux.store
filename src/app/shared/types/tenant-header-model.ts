// Tenant Header Info API Response Models
export interface TenantHeaderInfoDTO {
  tenantHeader: TenantHeaderDTO;
  branchesByCity: BranchByCityDTO[];
}

export interface TenantHeaderDTO {
  contactPhone: string;
  contactEmail: string;
  storeName: string;
  address: string;
  logo: string;
  vistourCount?: number;
}

export interface BranchByCityDTO {
  city: string;
  branches: BranchDTO[];
}

export interface BranchDTO {
  branchName: string;
  address: string;
}

