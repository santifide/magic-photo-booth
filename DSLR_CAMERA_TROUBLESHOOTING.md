# Solución de problemas para cámaras DSLR

## Problema: La cámara no es detectada o aparece un error de "Dispositivo o recurso ocupado"

Este es un problema común en sistemas Linux, donde un proceso del sistema bloquea el acceso a la cámara, impidiendo que la aplicación pueda controlarla.

### Síntomas

Al intentar tomar una foto con la cámara réflex, la aplicación muestra un error similar a:

```
Error: Could not claim the USB device: Dispositivo o recurso ocupado.
Make sure no other program (gvfs-gphoto2-volume-monitor) is using the device...
```

### Solución

Para solucionarlo, necesitas detener el proceso que está bloqueando la cámara. Sigue estos pasos:

1.  **Abre una terminal.**

2.  **Ejecuta el siguiente comando para encontrar y detener el proceso conflictivo:**

    ```bash
    killall gvfs-gphoto2-volume-monitor
    ```

3.  **Si el problema persiste, es posible que otros procesos `gvfs` estén bloqueando la cámara. Para encontrarlos y detenerlos, sigue estos pasos:**

    a. **Encuentra el bus y el dispositivo de tu cámara.** Con la cámara conectada, ejecuta:

       ```bash
       lsusb
       ```

       Busca tu cámara en la lista. Por ejemplo:
       `Bus 001 Device 009: ID 04b0:042f Nikon Corp. NIKON DSC D5200`

    b. **Usa `lsof` para ver qué procesos están usando ese dispositivo.** Reemplaza `001` y `009` con el Bus y el Device de tu cámara:

       ```bash
       sudo lsof /dev/bus/usb/001/009
       ```

    c. **El resultado te mostrará los procesos y sus PIDs (Process IDs).** Por ejemplo:

       ```
       COMMAND     PID      USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
       gvfsd-gph 81442 santifide   13u   CHR  189,8      0t0 1165 /dev/bus/usb/001/009
       gvfs-gpho 93266 santifide   12u   CHR  189,8      0t0 1165 /dev/bus/usb/001/009
       ```

    d. **Finalmente, detén esos procesos usando sus PIDs.** Reemplaza `81442` y `93266` con los PIDs que encontraste:

       ```bash
       kill 81442 93266
       ```

4.  **Intenta tomar la foto de nuevo desde la aplicación.** La cámara ahora debería estar libre.

---

## Problema: La foto se toma pero la aplicación no muestra la previsualización

### Síntomas

La cámara réflex hace el ruido de que ha tomado la foto, y el archivo se guarda correctamente en la carpeta `/fotos`, pero la aplicación se queda en "Tomando foto..." o muestra un error en la consola del navegador como `Error loading photo preview`.

### Causas y Soluciones

Este problema puede tener dos causas principales:

1.  **Formato de archivo incorrecto (RAW):**
    *   **Causa:** La cámara está configurada para guardar las fotos en formato RAW. La aplicación espera un archivo JPG para poder mostrar la previsualización.
    *   **Solución:** Entra en la configuración de tu cámara y asegúrate de que la calidad de imagen esté configurada en **JPG** (puede aparecer como "Fine", "Normal", "Basic" o similar, lo importante es que no sea "RAW" o "NEF").

2.  **La aplicación intenta mostrar la foto antes de que esté lista:**
    *   **Causa:** Aunque el comando para tomar la foto ha terminado, el archivo puede no estar completamente escrito en el disco cuando el navegador intenta cargarlo.
    *   **Solución:** Este problema se ha solucionado en el código del servidor (`server.js`) implementando un sistema de "vigilancia activa" (polling) que se asegura de que el archivo exista y esté listo antes de notificar a la aplicación.

---

## Problema: Los botones no se muestran correctamente después de tomar una foto con la réflex

### Síntomas

Después de tomar una foto con la cámara réflex y que esta se muestre en pantalla, el botón "Guardar foto" no aparece, y no hay una opción clara para volver al menú principal.

### Solución

Este es el comportamiento esperado, pero se ha mejorado para que sea más intuitivo:

*   **"Guardar foto"**: Este botón no es necesario, ya que la foto se guarda automáticamente en el servidor al ser tomada por la réflex.
*   **"Volver al menú"**: El botón "Guardar foto" ha sido reemplazado por un botón "Volver al menú" que te permite regresar a la pantalla principal una vez que estás satisfecho con la foto.
*   **"Borrar y tomar otra"**: Este botón sigue funcionando como antes, permitiéndote descartar la foto actual y empezar el proceso de nuevo.