import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular';
import { App } from './app';

describe('App', () => {
  const url = 'http://127.0.0.1:8000/api';
  const reto = {
    id: 1, titulo: 'Leer 10 libros', descripcion: '', fecha_inicio: '2026-11-18',
    estado: 'PENDIENTE', total_avances: 0,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideIonicAngular(), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('muestra los retos recibidos de la API', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne(url + '/retos/?page=1')
      .flush({ next: null, results: [reto] });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Leer 10 libros');
  });

  it('envía el nuevo reto y vuelve a cargar la lista', () => {
    const fixture = TestBed.createComponent(App);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne(url + '/retos/?page=1').flush({ next: null, results: [] });
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    (form.elements.namedItem('titulo') as HTMLInputElement).value = reto.titulo;
    (form.elements.namedItem('fecha_inicio') as HTMLInputElement).value = reto.fecha_inicio;
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    const request = http.expectOne({ method: 'POST', url: url + '/retos/' });
    expect(request.request.body.titulo).toBe(reto.titulo);
    request.flush(reto);
    http.expectOne(url + '/retos/?page=1').flush({ next: null, results: [reto] });
    expect(fixture.componentInstance.retos()[0]?.id).toBe(reto.id);
  });

  it('registra un avance y actualiza su contador', () => {
    const fixture = TestBed.createComponent(App);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne(url + '/retos/?page=1').flush({ next: null, results: [reto] });
    fixture.componentInstance.retoSeleccionado.set(reto.id);
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('ion-item form') as HTMLFormElement;
    (form.elements.namedItem('fecha') as HTMLInputElement).value = reto.fecha_inicio;
    (form.elements.namedItem('descripcion') as HTMLInputElement).value = 'Primer libro';
    (form.elements.namedItem('porcentaje') as HTMLInputElement).value = '10';
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    const request = http.expectOne({ method: 'POST', url: url + '/avances/' });
    expect(request.request.body).toEqual({
      reto: reto.id, fecha: reto.fecha_inicio, descripcion: 'Primer libro', porcentaje: 10,
    });
    request.flush({ id: 1 });
    expect(fixture.componentInstance.retos()[0]?.total_avances).toBe(1);
  });
});
