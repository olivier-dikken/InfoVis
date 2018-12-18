import pandas as pd
import json

path = "../WorldMap/resources/ISO3_headers.csv"

data = {}
df = pd.read_csv(path, dtype={"iso": str, "country": str})
print(df)

for (iso, country), bag in df.groupby(["iso", "country"]):
    data[iso] = country

with open("iso3.json", 'w') as fp:
    json.dump(data, fp, sort_keys=True)


print(0)