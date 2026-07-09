# 1. Cargar las librerías necesarias
library(ggplot2)
# La librería 'scales' nos ayuda a formatear los ejes fácilmente
library(scales) 

# 2. Generar datos simulados (Simulación de variabilidad)
# Definimos los tiempos de muestreo exactos
tiempos_base <- c(0, 0.5, 1, 2, 3, 4, 5, 6, 24)

# Simulamos los datos para las 3 pruebas añadiendo un poco de ruido aleatorio
set.seed(42) # Fijamos una "semilla" para que la simulación sea reproducible

# Prueba 1 (Base simulada)
p1 <- c(0, 12, 28, 48, 65, 77, 85, 91, 98)
# Prueba 2 (Un poco más rápida, con ruido)
p2 <- p1 + c(0, runif(8, 2, 6)) 
p2[p2 > 100] <- 100 # Asegurar que no supere el 100%
# Prueba 3 (Un poco más lenta, con ruido)
p3 <- p1 - c(0, runif(8, 1, 5)) 
p3[p3 < 0] <- 0     # Asegurar que no haya negativos

# Unificamos todo en un DataFrame formato "largo"
datos_completos <- data.frame(
  tiempo_horas = rep(tiempos_base, 3),
  dha_liberado = c(p1, p2, p3),
  Prueba = rep(c("Prueba 1", "Prueba 2", "Prueba 3"), each = length(tiempos_base))
)

# Definir los tiempos de muestreo exactos para las líneas verticales
tiempos_muestreo <- c(0.5, 1, 2, 3, 4, 5, 6, 24)

# 3. Generar el gráfico
grafico <- ggplot(datos_completos, aes(x = tiempo_horas, y = dha_liberado, color = Prueba)) +
  
  # Dibujar las líneas y los puntos para cada prueba
  geom_line(linewidth = 1) +
  geom_point(size = 2.5) +
  
  # Añadir las líneas punteadas verticales en los tiempos de muestreo
  geom_vline(xintercept = tiempos_muestreo, linetype = "dotted", color = "gray50", linewidth = 0.7) +
  
  # --- Configuración de Escalas ---
  
  # Eje X: Mostrar los cortes exactos de tus tiempos de muestreo
  scale_x_continuous(
    breaks = c(0, tiempos_muestreo),
    limits = c(0, 25),
    expand = c(0.02, 0)
  ) +
  
  # Eje Y: Límite de 0 a 100 y añadir el símbolo de % usando 'scales'
  scale_y_continuous(
    limits = c(0, 100),
    breaks = seq(0, 100, by = 20),           # Marcas principales cada 20%
    labels = percent_format(scale = 1),      # Formatea automáticamente como %
    expand = c(0, 0)                         # Elimina espacio extra
  ) +
  
  # --- Configuración de Colores ---
  # Definimos colores distintos manualmente para que sean claros
  scale_color_manual(values = c("Prueba 1" = "firebrick", 
                                "Prueba 2" = "royalblue3", 
                                "Prueba 3" = "forestgreen")) +
  
  # --- Etiquetas y Títulos ---
  labs(
    title = "Variabilidad en el Estudio de Liberación de DHA",
    subtitle = "Misma formulación - Tres réplicas independientes",
    x = "Tiempo (horas)",
    y = "% de DHA liberado",
    color = "Réplica" # Título de la leyenda
  ) +
  
  # Tema visual limpio y profesional
  theme_classic() +
  theme(
    plot.title = element_text(face = "bold", hjust = 0.5),
    plot.subtitle = element_text(hjust = 0.5),
    legend.position = "bottom", # Mueve la leyenda abajo
    panel.grid.major.y = element_line(color = "gray90", linetype = "dashed")
  )

# 4. Mostrar el gráfico
print(grafico)
