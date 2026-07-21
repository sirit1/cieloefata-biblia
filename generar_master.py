import json
import pandas as pd
import re

print("Iniciando motor de conversión ETL para CieloEfata...")

# 1. Cargar el JSON de la Reina Valera 1960
with open('biblia.json', 'r', encoding='utf-8') as f:
    data_json = json.load(f)

filas_biblia = []

# 2. Aplanar el JSON (Flattening) a formato relacional
for libro, capitulos in data_json.items():
    for capitulo, versiculos in capitulos.items():
        for versiculo, texto in versiculos.items():
            
            # Limpiar la "basura" del web scraping (ej: '),")
            texto_limpio = re.sub(r'[\'\"”\),]+$', '', texto)
            texto_limpio = re.sub(r'^[\'\"“\.,]+', '', texto_limpio).strip()
            
            # Crear la fila exacta que pide Supabase
            filas_biblia.append({
                'libro_key': libro.strip().lower(), # ej: '1-corintios'
                'capitulo': int(capitulo),
                'versiculo': int(versiculo),
                'texto_rvr1960': texto_limpio,
                'texto_nvi': '',      # Vacío por ahora, listo para futuro
                'texto_ntv': '',      # Vacío por ahora
                'texto_nbla': '',     # Vacío por ahora
                'texto_peshitta': '', # Vacío por ahora
                'idioma_original': '',# Aquí cruzaremos el Hebreo/Griego
                'traduccion_literal': '',
                'comentario_macarthur': ''
            })

# 3. Convertir a DataFrame de Pandas
df_master = pd.DataFrame(filas_biblia)

print(f"Éxito: Se procesaron {len(df_master)} versículos de la Biblia.")

# ---------------------------------------------------------
# OPCIONAL: Si ya tienes el CSV de Hebreo en la misma carpeta
# y tiene columnas como 'libro', 'capitulo', 'versiculo', 'texto_hebreo'
# ---------------------------------------------------------
try:
    print("Buscando dataset de Hebreo (HebrewStrongs.csv)...")
    df_hebreo = pd.read_csv('HebrewStrongs.csv') # Cambia el nombre si es distinto
    
    # Asegurar que las llaves coincidan en formato
    df_hebreo['libro_key'] = df_hebreo['libro'].str.lower().str.replace(' ', '-')
    
    # Hacer el cruce (Merge / JOIN)
    df_master = pd.merge(
        df_master, 
        df_hebreo[['libro_key', 'capitulo', 'versiculo', 'texto_hebreo']], 
        on=['libro_key', 'capitulo', 'versiculo'], 
        how='left'
    )
    
    # Pasar el texto hebreo a la columna oficial 'idioma_original'
    df_master['idioma_original'] = df_master['texto_hebreo']
    df_master = df_master.drop(columns=['texto_hebreo'])
    print("Cruce con Hebreo realizado con éxito.")
    
except FileNotFoundError:
    print("Aviso: No se encontró archivo de Hebreo. Se generará el master solo con RVR1960 por ahora.")
except Exception as e:
    print(f"Error al procesar el Hebreo: {e}")

# 4. Exportar el archivo final para Supabase
archivo_salida = 'master_biblia.csv'
df_master.to_csv(archivo_salida, index=False, encoding='utf-8')

print(f"\n¡Proceso Finalizado! Archivo '{archivo_salida}' generado exitosamente.")
print("Ya puedes arrastrarlo y soltarlo en tu tabla 'biblia_multiversion' en Supabase.")