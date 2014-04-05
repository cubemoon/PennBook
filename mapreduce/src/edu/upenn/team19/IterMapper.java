package edu.upenn.team19;
import java.io.IOException;

import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Mapper.Context;

public class IterMapper extends Mapper<LongWritable, Text, Text, Text>{
	
	public void map(LongWritable key, Text value, Context context) throws IOException, InterruptedException{
		String line = value.toString();
		String[] content = line.split("\t");
		
		System.out.println(value.toString());
		
		// Get the name, edges and ranks from other users of a user.
		String name = content[0];
		if (content[1].split(" ").length <= 1) return;
		String[] edges = content[1].split(" ")[0].split(";");
		String[] ranks = content[1].split(" ")[1].split(";");
		
		if (ranks.length < 1) {
			String[] temp = new String[1];
			temp[0] = 1 + "," + name;
		}
		
		for (String s : ranks) {
			System.out.println(s);
		}
		
		// Start the iteration
		for (String rank : ranks){
			if (rank.equals("")) continue;
			System.out.println("rank : " + rank);
			
			double ranknumber = Double.parseDouble(rank.split(",")[0]);
			String fromuser = rank.split(",")[1];
			
			System.out.println("ranknum: " + ranknumber + " fromuser: " + fromuser);
			
			for (String edge : edges){
				if (edge.equals("")) continue;
				double edgeweight = Double.parseDouble(edge.split(",")[0]);
				String touser = edge.split(",")[1];
				
				System.out.println("edgeweight: " + edgeweight +" touser: " + touser);
				
				// Calculated weight to be sent out
				double outweight = ranknumber * edgeweight;
				
				context.write(new Text(touser), new Text(fromuser + "," + outweight));
			}
		}
		
		// Keep track of graph structure data
		context.write(new Text(name), new Text("*" + content[1].split(" ")[0]));
	}
}