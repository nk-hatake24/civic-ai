from fastmcp import FastMCP
from app.services.wordbank import worldbank_client
from typing import Literal

mcp = FastMCP("CivicAI Tools")

@mcp.tool
async def get_country_info(country_code: str = "CM") -> dict:
    """
    Get metadata about a country like its capital, geographic region, 
    and official World Bank income level classification.
    """
    data = await worldbank_client._get_with_cache(f"country/{country_code}")
    if data and len(data) > 1:
        c = data[1][0]
        return {
            "name": c["name"],
            "capital": c["capitalCity"],
            "region": c["region"]["value"],
            "income_level": c["incomeLevel"]["value"]
        }
    return {"error": "Country not found"}

@mcp.tool
async def get_gdp_statistics(country_code: str = "CM") -> dict:
    """
    Fetch historical Gross Domestic Product (GDP) statistics in current USD for a country.
    Use this to answer questions about national wealth, economic scale, and GDP growth.
    """
    data = await worldbank_client.get_indicator("NY.GDP.MKTP.CD", country_code)
    return {
        "indicator": "GDP (Current USD)",
        "country": country_code,
        "source": "World Bank Open Data",
        "data": data
    }

@mcp.tool
async def get_population_data(country_code: str = "CM") -> dict:
    """
    Fetch historical total population statistics for a specific country.
    Use this to answer questions regarding demographics, census, and country population size.
    """
    data = await worldbank_client.get_indicator("SP.POP.TOTL", country_code)
    return {
        "indicator": "Total Population",
        "country": country_code,
        "source": "World Bank Open Data",
        "data": data
    }

@mcp.tool
async def get_labor_and_price_metrics(
    metric: Literal["Inflation", "Unemployment"],
    country_code: str = "CM"
) -> dict:
    """
    Fetch price stability metrics (Inflation CPI, annual %) or labor statistics (Unemployment, % of total labor force).
    Use this to answer questions regarding cost of living, inflation trends, and employment rates.
    """
    codes = {
        "Inflation": "FP.CPI.TOTL.ZG",
        "Unemployment": "SL.UEM.TOTL.ZS"
    }
    data = await worldbank_client.get_indicator(codes[metric], country_code)
    return {
        "indicator": metric,
        "country": country_code,
        "source": "World Bank Open Data",
        "data": data
    }

@mcp.tool
async def get_education_metrics(
    metric: Literal["Literacy Rate", "Primary Enrollment", "Education Expenditure"],
    country_code: str = "CM"
) -> dict:
    """
    Fetch historical educational development statistics, including adult literacy rate (%),
    primary net school enrollment rate (%), and public education spending as a % of GDP.
    Use this to answer questions about literacy, school enrollment, and educational budgets.
    """
    codes = {
        "Literacy Rate": "SE.ADT.LITR.ZS",
        "Primary Enrollment": "SE.PRM.NENR",
        "Education Expenditure": "SE.XPD.TOTL.GD.ZS"
    }
    data = await worldbank_client.get_indicator(codes[metric], country_code)
    return {
        "indicator": metric,
        "country": country_code,
        "source": "World Bank Open Data",
        "data": data
    }