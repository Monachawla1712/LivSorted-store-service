export class UserStoreMappingDto {
  constructor(userId: string, storeId: string, isActive: boolean) {
    this.user_id = userId;
    this.store_id = storeId;
    this.is_active = isActive;
  }

  user_id: string;
  store_id: string;
  is_active: boolean;
}
