// components/Card.jsx
import React from 'react';
import { MdLocalShipping, MdDone, MdSupportAgent, MdCheckCircle } from 'react-icons/md';

export const Card = ({ 
  order,
  variant = 'default',
  onAtender,
  onFinalizar,
  profile
}) => {

  const isAdminOrCalidad = profile?.rol_name?.toUpperCase() === 'ADMIN' || 
                           profile?.rol_name?.toUpperCase() === 'CALIDAD';

  const canFinalizar = profile?.rol_name?.toUpperCase() === 'ADMIN' || 
                       order.idsap_calidad === profile?.idsap;

  const estadoBadgeClass = (estado) => {
    switch(estado) {
      case 'pendiente':   return 'badge-pendiente';
      case 'en_proceso':  return 'badge-en-proceso';
      case 'cerrado':     return 'badge-cerrado';
      default:            return 'badge-default';
    }
  };

  const formatDate = (date) => new Date(date).toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  // ─── HEADERS ─────────────────────────────────────────────

  const renderHeader = () => {
    switch(variant) {

      case 'stapla':
        return (
          <div className="card-header card-header--stapla">
            <div className="card-header-top">
              <span className="card-station-badge">
                📍 {order.stapla_id || 'Estación'}
              </span>
              <span className={`card-badge ${estadoBadgeClass(order.estado)}`}>
                {order.estado}
              </span>
            </div>
            <h3 className="card-title">{order.tipo_soporte}</h3>
          </div>
        );

      case 'calidad':
        return (
          <div className="card-header card-header--calidad">
            <h3 className="card-title">{order.area} · {order.tipo_soporte}</h3>
          </div>
        );

      default:
        return (
          <div className="card-header card-header--default">
            <h3 className="card-title">{order.area} - Orden #{order.id_order}</h3>
            <span className={`card-badge badge-${order.status?.toLowerCase()}`}>
              {order.status}
            </span>
          </div>
        );
    }
  };

  // ─── BODY ────────────────────────────────────────────────

  const renderBody = () => {
    switch(variant) {

      case 'stapla':
        return (
          <div className="card-body">
      <p className="card-field">
        <strong>Solicitante:</strong> {order.nombre_solicitante}
      </p>
      <p className="card-field">
        <strong>Línea:</strong> {order.area}
      </p>
      {/* ✅ Sin fecha aquí — va en el footer */}
    </div>
        );

      case 'calidad':
        return (
          <div className="card-body">
            <p className="card-field">
              <strong>Solicitante:</strong> {order.nombre_solicitante}
            </p>
            <p className="card-field">
              <strong>Línea:</strong> {order.area}
            </p>
            <p className="card-field">
              <strong>Estación:</strong> {order.stapla_id}
            </p>
            {order.nombre_calidad && (
              <p className="card-field">
                <strong>Atendido por:</strong> {order.nombre_calidad}
              </p>
            )}
            <p className="card-date">{formatDate(order.created_at)}</p>
          </div>
        );

      default:
        return (
          <div className="card-body">
            <p className="card-field">
              <strong>Solicitante:</strong> {order.user_submit}
            </p>
            <p className="card-field">
              <strong>Línea:</strong> {order.destiny || order.area}
            </p>
            <p className="card-date">{formatDate(order.date_order || order.created_at)}</p>
          </div>
        );
    }
  };

  // ─── FOOTERS ─────────────────────────────────────────────

  const renderFooter = () => {

    if (variant === 'calidad') {
      return (
        <div className="card-footer card-footer--calidad">
          {order.estado === 'pendiente' && onAtender && isAdminOrCalidad && (
            <button
              onClick={() => onAtender(order.id)}
              className="btn-action btn-atender"
            >
              <MdSupportAgent /> ATENDER
            </button>
          )}
          {order.estado === 'en_proceso' && onFinalizar && isAdminOrCalidad && canFinalizar && (
            <button
              onClick={() => onFinalizar(order.id)}
              className="btn-action btn-finalizar"
            >
              <MdCheckCircle /> FINALIZAR
            </button>
          )}
        </div>
      );
    }

    if (variant === 'stapla') {
      return (
        <div className="card-footer card-footer--stapla">
      {/* ✅ Badge de atención en el footer */}
      {order.estado === 'en_proceso' && order.nombre_calidad && (
        <div className="card-attending-badge">
          <MdSupportAgent className="attending-icon" />
          <span>Atendido por <strong>{order.nombre_calidad}</strong></span>
        </div>
      )}
      {/* ✅ Solo una fecha */}
      <span className="card-date-footer">
        {formatDate(order.created_at)}
      </span>
    </div>
      );
    }

    return (
      <div className="card-footer card-footer--default">
        {variant === 'dispatch' ? (
          <button
            onClick={() => onStatusClick?.(order)}
            className={`status-button ${order.status?.toLowerCase().replace(' ', '-')}`}
          >
            {order.status === 'PENDIENTE' ? 'Iniciar Despacho' : 'Marcar Entregado'}
          </button>
        ) : (
          <div className="status-indicator">
            {order.status === 'EN_PROCESO' && <MdLocalShipping className="icon" />}
            {order.status === 'ENTREGADO'  && <MdDone className="icon" />}
            <span className="status-text">{order.status}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`card card--${variant} card--${(order.estado || order.status)?.toLowerCase()}`}>
      {renderHeader()}
      {renderBody()}
      {renderFooter()}
    </div>
  );
};