from fastmcp import FastMCP
from app.services.wordbank import worldbank_client
from typing import Literal

mcp = FastMCP("CivicAI Tools")

@mcp.tool
async def get_economic_indicator(
    indicator: Literal["GDP", "Population", "Inflation", "Unemployment"],
    country_code: str = "CM"
):
    """
    Fetch real-world economic data from the World Bank. 
    Use this when the user asks for specific numbers or statistics.
    """
    # Mapping friendly names to World Bank codes
    codes = {
        "GDP": "NY.GDP.MKTP.CD",
        "Population": "SP.POP.TOTL",
        "Inflation": "FP.CPI.TOTL.ZG",
        "Unemployment": "SL.UEM.TOTL.ZS"
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