from fastmcp import FastMCP
from app.services.wordbank import worldbank_client
from typing import Literal

mcp = FastMCP("CivicAI Tools")

@mcp.tool
async def get_development_indicator(
    indicator: Literal[
        "GDP", 
        "Population", 
        "Inflation", 
        "Unemployment", 
        "Literacy Rate", 
        "Primary Enrollment", 
        "Education Expenditure"
    ],
    country_code: str = "CM"
):
    """
    Fetch real-world development, economic, or education statistics from the World Bank. 
    Use this when the user asks for specific numbers, metrics, or education and growth statistics.
    """
    # Mapping friendly names to World Bank codes (including education metrics)
    codes = {
        "GDP": "NY.GDP.MKTP.CD",
        "Population": "SP.POP.TOTL",
        "Inflation": "FP.CPI.TOTL.ZG",
        "Unemployment": "SL.UEM.TOTL.ZS",
        "Literacy Rate": "SE.ADT.LITR.ZS",              # Taux d'alphabétisation des adultes (%)
        "Primary Enrollment": "SE.PRM.NENR",            # Taux net de scolarisation au primaire (%)
        "Education Expenditure": "SE.XPD.TOTL.GD.ZS"    # Dépenses publiques d'éducation (% du PIB)
    }
    
    data = await worldbank_client.get_indicator(codes[indicator], country_code)
    return {
        "indicator": indicator,
        "country": country_code,
        "source": "World Bank Open Data",
        "data": data
    }

@mcp.tool
async def get_country_info(country_code: str = "CM"):
    """Get metadata about a country like its capital and income level."""
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