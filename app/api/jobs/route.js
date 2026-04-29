import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Software Engineer';
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    return NextResponse.json({ error: "Adzuna keys not configured" }, { status: 500 });
  }

  try {
    const response = await fetch(`https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=20&what=${encodeURIComponent(title)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch jobs");
    }

    const uniqueCompanies = new Set();
    const jobs = [];

    for (const job of data.results) {
      const companyName = job.company.display_name;
      if (!uniqueCompanies.has(companyName)) {
        uniqueCompanies.add(companyName);
        jobs.push({
          id: job.id,
          title: job.title.replace(/<[^>]+>/g, ''),
          company: companyName,
          location: job.location.display_name,
          salary: job.salary_min && job.salary_max ? `₹${job.salary_min} - ₹${job.salary_max}` : "Salary Undisclosed",
          url: job.redirect_url,
          description: job.description
        });
      }
      if (jobs.length >= 5) break;
    }

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Adzuna API Error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs from Adzuna" }, { status: 500 });
  }
}
