import pandas as pd
import numpy as np
print("Running..")

path = "C:/Users/lexme/Desktop/Q1/DataVis/InfoVis/WorldMap/resources/c5fe9392-8421-43cc-b646-6b2d7879c3d8_Data.csv"
path2 = "C:/Users/lexme/Desktop/Q1/DataVis/InfoVis/WorldMap/resources/unhcr_popstats_export_persons_of_concern_all_data.csv"
path3 =  "C:/Users/lexme/Desktop/Q1/DataVis/InfoVis/WorldMap/resources/unhcr_popstats_export_persons_of_concern_2018_12_02_205924.csv"

def selectYear(columns, row):
    year = row['Year']
    select = ""
    for i in columns:
        if i == year:
            select = i
    row["GDP"] = row["select"]


gdp = pd.read_csv(path)
gdp = gdp.replace(r'[.]{2,}', np.nan, regex=True)
gdp = gdp.fillna('0')
gdp.rename(columns={gdp.columns[0] : 'Country'}, inplace = True)
gdp['GDP'] = ""

migration = pd.read_csv(path3,sep= ',(?!\s)', engine = 'python')
migration = migration.replace(r'\*', np.nan, regex=True)
#migration = migration.fillna(0)
migration.rename(columns={migration.columns[1]  : 'Country', migration.columns[3] : 'Refugees'}, inplace = True)


#migration = pd.merge(migration, gdp, how = 'left', on = 'Country')

migration["Indicator"] = migration["Origin"]
#migration = migration.loc[migration.Year >= 2010,:]

for i in range(1951,2018):
    migration[i] = None

migrationNew = migration.drop_duplicates(subset= {"Country", "Indicator"}, keep = False)

migrationNew = pd.pivot_table(migrationNew, index= ["Country", "Indicator"],values = ["Refugees"],  columns= ["Year"], aggfunc=  np.sum)

for i in range(1951,2018):
    migration[i] = migration.loc[migration["Year"] == i, "Refugees"]

def test(x):
    temp = x


#migration = migration.groupby(["Country", "Indicator"]).apply(lambda x: test(x))


print(migration.groups)

#gdp.to_csv('gdp.csv', sep = "," , index = False)