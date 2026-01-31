import EventCard from "@/components/EventCard"
import ExploreBtn from "@/components/ExploreBtn"
import { IEvent } from "@/database/event.model";

import { cacheLife } from "next/cache";

const base_url = process.env.NEXT_PUBLIC_BASE_URL;
const page = async () => {
   "use cache"
   cacheLife("hours")
   const response = await fetch(`${base_url}/api/events`);
   const { events } = await response.json();
  
  return (
    <section>
      
      <h1 className="text-center">The Hub for Every Dev <br/> Event you Can't Miss </h1>
      <p className="text-center mt-5 ">Hackthons, Meetups, and Conferences. All in One Place</p>
      
      <ExploreBtn  />
       
       <div className="mt-20 space-x-7">
          <h3>Featured Events</h3>

          <ol className="events" >
             {events && events.length > 0 && events.map((event: IEvent) => (
                <li key={event.title}><EventCard title={event.title} image={event.image} slug={event.slug} location={event.location} date={event.date} time={event.time}/></li>
             ))}

          </ol>
       </div>
      
    </section>
  )
}

export default page
