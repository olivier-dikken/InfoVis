var output = "";
var startYear = 1951;
var endYear = 2017;
var indicatorName = "Refugees";

var gbStartYear = 1960;
var gbEndYear = 2017;

//generate with statements
output += "with countries as" + "\n"
  + "(" + "\n"
  + "select distinct Country" + "\n"
  + "from [InfoVis_v1].[dbo].[unhcr_popstats]" + "\n"
  + ")," + "\n";
output += "origins as" + "\n"
  + "(" + "\n"
  + "select distinct Origin" + "\n"
  + "from [InfoVis_v1].[dbo].[unhcr_popstats]" + "\n"
  + ")," + "\n";
for (i = startYear; i <= endYear; i++){
 	output +=
 	"un" + i + " as"  + "\n"
 	+ "(" + "\n"
 	+ "select Country, Origin, sum(isnull(Refugees,0)) as Refugees" + "\n"
 	+ "from [InfoVis_v1].[dbo].[unhcr_popstats]" + "\n"
 	+ "where Year = " + i + "\n"
 	+ "group by Country, Origin" + "\n"
 	+ ")";
 	if(i != endYear){//add comma unless last iteration
 		output += ",";
 	}
 	output += "\n";//add newline after every block
}
//generate select statement
output += "insert into dataset" + "\n"
+ "select c.Country as Country," + "\n"
+ generateIndicatorSelect(indicatorName) 
+ "from countries c" + "\n"
+ "cross join origins o" + "\n"
+ generateJoins(startYear, endYear, true)
+ generateWhere(indicatorName);


console.log(output);


// create destination table
var createTableSql = "";
createTableSql += "create table dataset (Country varchar(10) not null, Indicator varchar(100) not null";
for(i = startYear; i <= endYear; i++){
	createTableSql += ", \"" + i + "\" float";
}
createTableSql += ")";

console.log(createTableSql);


// create global bank indicators insert table
var createGBITableSql = "";
createGBITableSql += "create table gbdata (Country varchar(10) not null, Indicator varchar(100) not null";
for(i = gbStartYear; i <= gbEndYear; i++){
	createGBITableSql += ", \"" + i + "\" float";
}
createGBITableSql += ")";

console.log(createGBITableSql);


function generateIndicatorSelect(indicatorName){
	result = "concat('" + indicatorName + "_', o.Origin) as Indicator," + "\n";
	for(i = startYear; i <= endYear; i++){
		result += "un" + i + "." + indicatorName + " as '" + i + "'";
		if(i != endYear){
			result += ",";
		}
		result += "\n";
	}
	return result;
}

function generateJoins(startYear, endYear, withOrigin){
	result = "";
	for(i = startYear; i <= endYear; i++){
		result += "full outer join un" + i + " on un" + i + ".Country = c.Country"
		if(withOrigin){
			result += " and un" + i + ".Origin = o.Origin" ; 
		} 
		result += "\n";
	}
	return result;
}

function generateWhere(indicatorName){
	result = "where 1=1" + "\n";
	result += "and not ("
	for(i = startYear; i <= endYear; i++){
		if(i != startYear)
			result += "and ";
		result += "un" + i + "." + indicatorName + " IS NULL" + "\n";
	}
	result += ")"
	return result;
}

