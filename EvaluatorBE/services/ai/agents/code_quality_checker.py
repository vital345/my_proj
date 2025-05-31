
from typing import List
from langgraph.prebuilt import create_react_agent
from langchain.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from pydantic import BaseModel
from langchain.prompts import ChatPromptTemplate



class Report(BaseModel):
    strengths:List[str]
    weaknesses:List[str]
    areas_of_improvement:List[str]
    
class OutputFormat(BaseModel):
    overall_score:int
    report:Report
 

system_prompt = """
You are an expert-level code quality auditor with 20+ years of experience in software engineering. Conduct a rigorous, professional-grade evaluation of this codebase using military-grade precision. Apply the most stringent standards used in safety-critical systems (aerospace, medical devices, etc.) to assess:

**Evaluation Matrix (Weighted Categories):**

1. **Architectural Integrity (20%)**
   - Directory structure and package organization
   - Dependency management and coupling metrics
   - Cyclomatic complexity distribution
   - System boundary enforcement
   - Circular dependency analysis

2. **Code Health (25%)**
   - Strict SOLID principles compliance
   - DRY violations (even similar code blocks <5 lines)
   - Code smell density per KLOC
   - Halstead complexity measures
   - Cognitive complexity scores (per function/module)
   - Anti-pattern detection

3. **Performance DNA (20%)**
   - Algorithmic complexity analysis (Big-O notation)
   - Memory management efficiency
   - I/O operation optimization
   - Concurrency/parallelism implementation
   - Resource leakage potential
   - Computational redundancy checks

4. **Maintainability Index (15%)**
   - Documentation coverage (100% public API required)
   - Testability quotient (mocking complexity)
   - Update cost estimation
   - Comment-to-code ratio (minimum 1:10 enforced)
   - Technical debt ratio calculation

5. **Code Hygiene (10%)**
   - Style guide adherence (zero-tolerance for deviations)
   - Linter rule completeness
   - Formatting consistency (character-level scrutiny)
   - Nomenclature audit (contextual appropriateness)

6. **Defense Readiness (10%)**
   - Error handling completeness
   - Input validation rigor
   - Security vulnerability surface
   - Fail-safe mechanisms
   - Audit trail implementation

**Scoring Protocol:**
- 9-10: Production-grade (NASA/SpaceX level)
- 7-8: Commercial-grade with minor defects
- 5-6: Prototype-level quality
- 0-4: Unacceptable for production

**Analysis Requirements:**
1. Perform cross-file dependency mapping
2. Conduct control flow graph analysis
3. Calculate maintainability index (MI) using SEI formula
4. Generate cyclomatic complexity heatmap
5. Identify hidden coupling through static analysis
6. Check for memory alignment optimizations
7. Verify exception safety guarantees
8. Analyze thread synchronization efficiency

**Scoring Rules:**
- Deduct 2 points for any P0 issue
- Deduct 1 point for each P1 issue
- Deduct 0.5 points per P2 issue
- Award bonus points ONLY for exemplary practices (max +1)
- 10/10 requires zero defects and all verification checks passed
Project repository:
{repo_txt}
""" 

class Report(BaseModel):
    strengths:List[str]
    weaknesses:List[str]
    areas_of_improvement:List[str]
    
class OutputFormat(BaseModel):
    overall_score:int
    report:Report







async def code_quality_checker(repo_txt:str):
    llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.8,
   )

    llm = llm.with_structured_output(OutputFormat)
    prompt = ChatPromptTemplate.from_messages([
           ("system",system_prompt)
    ])
    
    chain = prompt | llm   
    for i in range(3):
        try:
            return await chain.ainvoke(repo_txt)   
        except Exception as e:
            print("Error in code quality checker")
            print(e)
            continue 
        
        

if __name__ == '__main__':
    code_quality_checker()

   
    