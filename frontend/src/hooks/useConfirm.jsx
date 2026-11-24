import { useCallback, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

/**
 * Reemplazo de window.confirm con el modal del diseño.
 *
 *   const [confirm, confirmDialog] = useConfirm();
 *   if (!(await confirm({ title: '¿Discontinuar?', tone: 'danger' }))) return;
 *   ...
 *   return <>{...}{confirmDialog}</>;
 *
 * confirm() devuelve una Promise<boolean>: true si confirma, false si cancela
 * (botón, Esc o click en el fondo).
 */
export function useConfirm() {
  // { options, resolve } del pedido en curso; null = modal cerrado.
  const [request, setRequest] = useState(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setRequest({ options, resolve });
      }),
    []
  );

  const settle = (result) => {
    request?.resolve(result);
    setRequest(null);
  };

  const confirmDialog = (
    <ConfirmDialog
      open={Boolean(request)}
      {...request?.options}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  );

  return [confirm, confirmDialog];
}

export default useConfirm;
