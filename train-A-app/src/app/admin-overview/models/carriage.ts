export interface Carriage {
  code: string;
  name: string;
  rows: number;
  leftSeats: number;
  rightSeats: number;
}

export interface CarriageDataForSchema {
  name: string;
  rows: number;
  leftSeats: number;
  rightSeats: number;
}

export type CarriageFormEditMode = 'create' | 'edit' | 'save';

export interface CarriageResponse {
  code: string;
}
