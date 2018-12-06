import pandas as pd
import numpy as np
import os
print("Running..")

iso = pd.read_json("list.json")
mig = pd.read_csv("migration_clean.csv")

data  = pd.merge(mig, iso, left_on='Country', right_on='name_en')
cols = list(data.columns[0:70])[0:69]
cols.insert(1,'country_code')
data = data[cols]

work_path = r'D:\CS\IN4086-14 Data Visualisation\IV\Python'
data.to_csv(os.path.join(work_path,r'migration_clean_ISO.csv'))