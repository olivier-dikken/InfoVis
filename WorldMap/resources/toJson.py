import pandas as pd
import json

path = "C:/Users/lexme/PycharmProjects/InfoVis/clean.xlsx"
data = {}
group = pd.read_excel(path, sheet_name=None)["Sheet1"].groupby(["Country"]).apply(lambda x: x.drop('Country', axis = 1).to_dict(orient='records')).to_dict()
for key, value in group.items():
    dict = {}
    for item in value:
        indicator = item["Indicator"]
        values = list(item.values())
        values.pop(0)
        dict[indicator] = values
    data[key] = dict

with open("data.json", 'w') as fp:
    json.dump(data, fp, sort_keys=True)



print(0)