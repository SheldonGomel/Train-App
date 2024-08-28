import { createFeature, createReducer, on } from '@ngrx/store';
import { rolesListActions } from './roles.actions';

const initialState: string = 'null';

export const rolesReducer = createFeature({
  name: 'roleState',
  reducer: createReducer(
    initialState,
    on(rolesListActions.changeRole, (state, { role }): string => role),
  ),
});
