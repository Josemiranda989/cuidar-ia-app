// Índice de la API que se muestra en GET /.
// Al agregar, sacar o renombrar una ruta hay que actualizarlo: test/endpoints.test.js falla si no coincide.
const endpoints = [
  {
    nombre: 'Estado del servidor',
    endpoint: 'GET /api/health',
    detalle: 'Indica si la API está funcionando.'
  },

  {
    nombre: 'Listar personas a cargo',
    endpoint: 'GET /api/dependents',
    detalle: 'Devuelve todas las personas a cargo, con la edad calculada.'
  },
  {
    nombre: 'Ver persona a cargo',
    endpoint: 'GET /api/dependents/:id',
    detalle: 'Devuelve una persona a cargo por su id.'
  },
  {
    nombre: 'Crear persona a cargo',
    endpoint: 'POST /api/dependents',
    detalle:
      'Obligatorios: nombre_completo, fecha_nacimiento. Opcionales: dni, parentesco, obra_social, numero_afiliado, notas.'
  },
  {
    nombre: 'Editar persona a cargo',
    endpoint: 'PATCH /api/dependents/:id',
    detalle: 'Actualiza solo los campos enviados.'
  },
  {
    nombre: 'Borrar persona a cargo',
    endpoint: 'DELETE /api/dependents/:id',
    detalle: 'Borra la persona y también sus medicaciones, tomas, médicos y condiciones.'
  },

  {
    nombre: 'Listar medicaciones',
    endpoint: 'GET /api/medications',
    detalle: 'Devuelve las medicaciones con sus horarios y su médico. Filtro opcional: ?personaId=.'
  },
  {
    nombre: 'Ver medicación',
    endpoint: 'GET /api/medications/:id',
    detalle: 'Devuelve una medicación por su id, con sus horarios y su médico.'
  },
  {
    nombre: 'Crear medicación',
    endpoint: 'POST /api/medications',
    detalle:
      'Obligatorios: persona_id, droga, concentracion, cantidad_por_toma, forma (comprimido, gota, ml o aplicacion), fecha_inicio. Opcionales: medico_id, nombre_comercial, via, motivo, indicaciones, es_sos, estado, fecha_fin, motivo_baja, horarios [{ hora, dias_semana }].'
  },
  {
    nombre: 'Editar medicación',
    endpoint: 'PATCH /api/medications/:id',
    detalle:
      'Actualiza solo los campos enviados. Si se envía horarios, reemplaza la lista completa. Con estado (activa o discontinuada) se discontinúa o reactiva.'
  },
  {
    nombre: 'Borrar medicación',
    endpoint: 'DELETE /api/medications/:id',
    detalle: 'Borra la medicación y también sus horarios y tomas.'
  },

  {
    nombre: 'Listar médicos',
    endpoint: 'GET /api/doctors',
    detalle: 'Devuelve los médicos. Filtro opcional: ?personaId=.'
  },
  {
    nombre: 'Ver médico',
    endpoint: 'GET /api/doctors/:id',
    detalle: 'Devuelve un médico por su id.'
  },
  {
    nombre: 'Crear médico',
    endpoint: 'POST /api/doctors',
    detalle: 'Obligatorios: persona_id, nombre. Opcionales: especialidad, matricula.'
  },
  {
    nombre: 'Editar médico',
    endpoint: 'PATCH /api/doctors/:id',
    detalle: 'Actualiza solo los campos enviados. persona_id no se puede modificar.'
  },
  {
    nombre: 'Borrar médico',
    endpoint: 'DELETE /api/doctors/:id',
    detalle: 'Borra el médico. Sus medicaciones quedan sin médico asignado.'
  },

  {
    nombre: 'Listar condiciones',
    endpoint: 'GET /api/conditions',
    detalle: 'Devuelve los diagnósticos y las alergias. Filtro opcional: ?personaId=.'
  },
  {
    nombre: 'Ver condición',
    endpoint: 'GET /api/conditions/:id',
    detalle: 'Devuelve un diagnóstico o una alergia por su id.'
  },
  {
    nombre: 'Crear condición',
    endpoint: 'POST /api/conditions',
    detalle: 'Obligatorios: persona_id, tipo (diagnostico o alergia), descripcion.'
  },
  {
    nombre: 'Editar condición',
    endpoint: 'PATCH /api/conditions/:id',
    detalle: 'Actualiza solo los campos enviados. persona_id no se puede modificar.'
  },
  {
    nombre: 'Borrar condición',
    endpoint: 'DELETE /api/conditions/:id',
    detalle: 'Borra el diagnóstico o la alergia.'
  },

  {
    nombre: 'Listar tomas',
    endpoint: 'GET /api/doses',
    detalle: 'Devuelve las tomas registradas. Filtros opcionales: ?personaId= y ?fecha=YYYY-MM-DD.'
  },
  {
    nombre: 'Registrar toma',
    endpoint: 'POST /api/doses',
    detalle:
      'Obligatorios: horario_id, fecha (YYYY-MM-DD), estado (tomada u omitida). Si ya había una para ese horario y fecha, la corrige.'
  },
  {
    nombre: 'Deshacer toma',
    endpoint: 'DELETE /api/doses/:id',
    detalle: 'Borra el registro de la toma.'
  }
];

export default endpoints;
