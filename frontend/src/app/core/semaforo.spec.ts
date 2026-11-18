import { calcularSemaforo, diasEntre, evaluarSemana } from './semaforo';
import { TareaSemanal } from './modelos';

const INICIO = '2026-11-16'; // lunes semana 7
const FIN = '2026-11-22'; // domingo semana 7

describe('calcularSemaforo', () => {
  it('una semana futura queda PENDIENTE', () => {
    expect(calcularSemaforo(0, INICIO, FIN, '2026-11-10')).toBe('PENDIENTE');
  });

  it('la semana en curso queda ABIERTA, incluso su último día', () => {
    expect(calcularSemaforo(0, INICIO, FIN, '2026-11-18')).toBe('ABIERTA');
    expect(calcularSemaforo(0, INICIO, FIN, FIN)).toBe('ABIERTA');
  });

  it('cerrada con 100 % queda VERDE', () => {
    expect(calcularSemaforo(100, INICIO, FIN, '2026-11-23')).toBe('VERDE');
  });

  it('cerrada con menos de 10 % queda ROJO', () => {
    expect(calcularSemaforo(0, INICIO, FIN, '2026-11-23')).toBe('ROJO');
    expect(calcularSemaforo(9, INICIO, FIN, '2026-11-23')).toBe('ROJO');
  });

  it('cerrada entre 10 % y 99 % queda AMARILLO', () => {
    for (const porcentaje of [10, 50, 70, 99]) {
      expect(calcularSemaforo(porcentaje, INICIO, FIN, '2026-11-23')).toBe('AMARILLO');
    }
  });
});

describe('evaluarSemana', () => {
  const tarea: TareaSemanal = {
    id: 1, reto: 1, reto_titulo: 'Leer', semana: 7, fecha_inicio: INICIO,
    fecha_fin: FIN, descripcion: '', porcentaje: 5, actualizado: '',
  };

  it('marca en riesgo una semana abierta con poco avance a 2 días del cierre', () => {
    expect(evaluarSemana(tarea, '2026-11-20').enRiesgo).toBe(true);
    expect(evaluarSemana(tarea, '2026-11-17').enRiesgo).toBe(false);
  });

  it('una semana cerrada no es editable', () => {
    expect(evaluarSemana(tarea, '2026-11-23').editable).toBe(false);
  });

  it('calcula los días entre fechas', () => {
    expect(diasEntre('2026-11-20', '2026-11-22')).toBe(2);
  });
});
