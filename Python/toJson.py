import pandas as pd
import json

path = "../WorldMap/resources/dataset_v4.csv"

data = {}
group = pd.read_csv(path).groupby(["Country"]).apply(lambda x: x.drop('Country', axis = 1).to_dict(orient='records')).to_dict()
for key, value in group.items():
    dict = {}
    for item in value:
        indicator = item["Indicator"]
        values = [None if pd.isnull(i) else i for i in list(item.values())]
        values.pop(0)
        dict[indicator] = values
    data[key] = dict

with open("data_v4.json", 'w') as fp:
    json.dump(data, fp, sort_keys=True)


print(0)