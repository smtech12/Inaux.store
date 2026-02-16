// Customer Contact Info API Response Model
export interface CustomerContactInfoDTO {
  id: number;
  customerName: string;
  email: string;
  phoneNumber: string;
  secondaryPhoneNumber: string | null;
  address: string | null;
}

