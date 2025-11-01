# Magic Photo Booth

Este es un proyecto de "espejo mágico" o "cabina de selfies" interactiva.

## Descripción

La aplicación permite a los usuarios tomarse fotos, grabar videosaludos y ver una galería de los momentos capturados. Está diseñada para funcionar en una pantalla táctil conectada a un PC con una webcam y, opcionalmente, una cámara réflex y una impresora.

## Estructura de Carpetas

*   `/backgrounds`: Contiene las imágenes que se muestran en el carrusel de la pantalla de inicio.
*   `/fotos`: Almacena todas las fotografías tomadas por los usuarios.
*   `/video`: Almacena todos los videosaludos grabados.
*   `/template`: Contiene el archivo `template.png` que se superpone a las fotos antes de imprimirlas.

## Funcionalidades (Planificadas)

1.  **Pantalla de Inicio**: Un carrusel de imágenes de fondo con un botón "comenzar".
2.  **Tomar Foto**: Activa la cámara, inicia un conteo y captura una foto. Permite guardar, descartar o imprimir la imagen.
3.  **Grabar Videosaludo**: Inicia una grabación de video con controles en pantalla. Permite guardar o descartar el video.
4.  **Ver Galería**: Muestra las fotos y videos guardados.
5.  **Menú de Configuración**: Permite ajustar parámetros como tiempos de conteo, duración de video, selección de cámara (webcam/réflex) y activación de la impresora.

## Tecnología

*   **Frontend**: HTML, Tailwind CSS (vía Play CDN)
*   **Backend**: Node.js (planificado)
*   **Lógica de cliente**: JavaScript
