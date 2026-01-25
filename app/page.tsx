import EventCard from "@/components/EventCard"
import ExploreBtn from "@/components/ExploreBtn"
import { events } from "@/lib/constants"


const page = () => {

  
  return (
    <section>
      
      <h1 className="text-center">The Hub for Every Dev <br/> Event you Cant't Miss </h1>
      <p className="text-center mt-5 ">Hackthons, Meetups, and Conferences. All in One Place</p>
      
      <ExploreBtn  />
       
       <div className="mt-20 space-x-7">
          <h3>Featured Events</h3>

          <ol className="events" >
             {events.map((event) => (
                <li key={event.title}><EventCard title={event.title} image={event.image} slug={event.slug} location={event.location} date={event.date} time={event.time}/></li>
             ))}

          </ol>
       </div>
      
    </section>
  )
}

export default page
