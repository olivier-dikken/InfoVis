import pandas as pd
import matplotlib.pyplot as plt

path = "../WorldMap/resources/dataset_v2.csv"

group = pd.read_csv(path).groupby(["Country"]).apply(lambda x: x.drop('Country', axis = 1).to_dict(orient='records')).to_dict()
refTotal = []
for key, value in group.items():
    for item in value:
        indicator = item["Indicator"]
        plotValues = [0 if pd.isnull(i) else i for i in list(item.values())]
        plotValues.pop(0)
        plotValues = filter(lambda a: a != 0, plotValues)
        if indicator == 'Refugees_Total':
            refTotal.extend(plotValues)

refTotal.sort()
n, bins, patches = plt.hist(refTotal, 100)
plt.savefig('TotalRefugeesSamplesHist.png', bbox_inches='tight')

#
# plt.plot(refTotal)

# plt.plot(refTotal, 'ro')
# plt.ylabel('Total Refugees')
# plt.gca().axes.get_xaxis().set_visible(False)
# plt.title('Samples of total refugees per country per year in ascending order')
# plt.savefig('TotalRefugeesSamples.png', bbox_inches='tight')


#

print('Finished')